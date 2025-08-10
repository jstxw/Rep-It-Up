# client.py  — AIGym + WebSocket updates
import argparse, asyncio, json, threading, time
from urllib.parse import quote

import cv2
from ultralytics import solutions
import websockets

def parse_args():
    ap = argparse.ArgumentParser()
    ap.add_argument("--room", required=True, help="Room code (e.g., ABCD)")
    ap.add_argument("--name", required=True, help="Your display name")
    ap.add_argument("--server", default="ws://localhost:8000", help="WebSocket server base URL")
    ap.add_argument("--camera", type=int, default=0, help="OpenCV camera index")
    ap.add_argument("--model", default="yolo11n-pose.pt", help="Ultralytics pose model")
    ap.add_argument("--record", action="store_true", help="Save annotated video to workouts_output.avi")
    # push-up keypoints: right shoulder, elbow, wrist
    ap.add_argument("--kpts", nargs=3, type=int, default=[6, 8, 10], help="Keypoint indices for angle")
    return ap.parse_args()

async def ws_task(uri, shared):
    # shared = {"count": int, "running": bool}
    async for ws in websockets.connect(uri, ping_interval=20, ping_timeout=20):
        try:
            last_sent = -1
            while shared["running"]:
                if shared["count"] != last_sent:
                    await ws.send(json.dumps({"type": "update", "count": int(shared["count"]) }))
                    last_sent = shared["count"]
                # Drain any messages (ignored here, but keeps the socket healthy)
                try:
                    _ = await asyncio.wait_for(ws.recv(), timeout=0.1)
                except asyncio.TimeoutError:
                    pass
                await asyncio.sleep(0.05)
        except Exception:
            await asyncio.sleep(1.0)
        finally:
            if not shared["running"]:
                break

def main():
    args = parse_args()

    uri = f"{args.server}/ws/{args.room.upper()}?name={quote(args.name)}"
    shared = {"count": 0, "running": True}

    loop = asyncio.new_event_loop()
    threading.Thread(target=loop.run_until_complete, args=(ws_task(uri, shared),), daemon=True).start()

    cap = cv2.VideoCapture(args.camera)
    assert cap.isOpened(), "Error reading camera"

    # Optional writer
    writer = None
    if args.record:
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        writer = cv2.VideoWriter("workouts_output.avi", cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))

    # Use YOUR detection logic (AIGym)
    gym = solutions.AIGym(
        show=True,               # AIGym handles window display internally
        kpts=args.kpts,          # [6,8,10] = R shoulder, elbow, wrist
        model=args.model,
    )

    try:
        while cap.isOpened():
            ok, im0 = cap.read()
            if not ok:
                print("Video frame is empty or processing is complete.")
                break

            # AIGym returns annotated frame + counts per tracked person
            results = gym.process(im0)  # same as calling gym(im0) in recent builds
            if writer is not None:
                writer.write(results.plot_im)

            # Use the highest count (single user per client; robust if tracker re-ids)
            counts = getattr(results, "workout_count", []) or []
            current = int(max(counts) if counts else shared["count"])
            if current != shared["count"]:
                shared["count"] = current

            # Tiny sleep to keep CPU sane
            time.sleep(0.001)

    finally:
        shared["running"] = False
        cap.release()
        if writer is not None:
            writer.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
