# client.py
import argparse, asyncio, json, math, threading, time
import cv2
import numpy as np
from urllib.parse import quote
import websockets

from ultralytics import YOLO  # pip install ultralytics
# pip install opencv-python numpy websockets

UP_THRESH = 155.0
DOWN_THRESH = 65.0
EMA_ALPHA = 0.2

def angle_deg(a, b, c):
    # angle at b, with points as (x,y)
    a, b, c = np.array(a, float), np.array(b, float), np.array(c, float)
    v1, v2 = a - b, c - b
    n1, n2 = np.linalg.norm(v1), np.linalg.norm(v2)
    if n1 == 0 or n2 == 0:
        return None
    cosang = np.clip(np.dot(v1, v2) / (n1 * n2), -1.0, 1.0)
    return math.degrees(math.acos(cosang))

class RepCounter:
    def __init__(self):
        self.state = "up"   # 'up' or 'down'
        self.count = 0
        self.ema_angle = None

    def update(self, angle):
        if angle is None:
            return self.count
        if self.ema_angle is None:
            self.ema_angle = angle
        else:
            self.ema_angle = EMA_ALPHA * angle + (1 - EMA_ALPHA) * self.ema_angle

        if self.state == "up" and self.ema_angle < DOWN_THRESH:
            self.state = "down"
        elif self.state == "down" and self.ema_angle > UP_THRESH:
            self.count += 1
            self.state = "up"
        return self.count

async def ws_task(uri, shared):
    # shared = dict(count=int, leaderboard=list[dict], running=bool)
    async for ws in websockets.connect(uri, ping_interval=20, ping_timeout=20):
        try:
            # notify server initially
            await ws.send(json.dumps({"type":"update","count":shared["count"]}))
            last_sent = -1
            while shared["running"]:
                # send update if count changed
                if shared["count"] != last_sent:
                    await ws.send(json.dumps({"type": "update", "count": shared["count"]}))
                    last_sent = shared["count"]
                # read any inbound messages without blocking too long
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=0.1)
                    data = json.loads(msg)
                    if data.get("type") in ("leaderboard","join","leave"):
                        shared["leaderboard"] = data.get("players", [])
                except asyncio.TimeoutError:
                    pass
                await asyncio.sleep(0.05)
        except Exception:
            await asyncio.sleep(1.0)  # retry
        finally:
            if not shared["running"]:
                break

def draw_overlay(frame, count, angle, leaderboard):
    h, w = frame.shape[:2]
    pad = 12
    # Count box
    cv2.rectangle(frame, (pad, pad), (pad+220, pad+90), (0,0,0), -1)
    cv2.putText(frame, f"Reps: {count}", (pad+14, pad+40), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255,255,255), 2, cv2.LINE_AA)
    if angle is not None:
        cv2.putText(frame, f"Elbow: {int(angle)} deg", (pad+14, pad+75), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200,200,200), 1, cv2.LINE_AA)

    # Leaderboard box (top-right)
    lbx, lby = w-260, pad
    cv2.rectangle(frame, (lbx, lby), (w-pad, lby+24*(min(8, len(leaderboard))+2)), (0,0,0), -1)
    cv2.putText(frame, "Leaderboard", (lbx+12, lby+20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2, cv2.LINE_AA)
    for i, p in enumerate(leaderboard[:8], start=1):
        cv2.putText(frame, f"{i}. {p['name'][:14]:14} {p['count']}", (lbx+12, lby+20+24*i),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220,220,220), 1, cv2.LINE_AA)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--room", required=True, help="Room code (e.g., ABCD)")
    ap.add_argument("--name", required=True, help="Your display name")
    ap.add_argument("--camera", type=int, default=0, help="OpenCV camera index")
    ap.add_argument("--server", default="ws://localhost:8000", help="WebSocket server base URL")
    ap.add_argument("--model", default="yolo11n-pose.pt", help="Ultralytics pose model")
    args = ap.parse_args()

    uri = f"{args.server}/ws/{args.room.upper()}?name={quote(args.name)}"

    shared = {"count": 0, "leaderboard": [], "running": True}
    loop = asyncio.new_event_loop()
    t = threading.Thread(target=loop.run_until_complete, args=(ws_task(uri, shared),), daemon=True)
    t.start()

    model = YOLO(args.model)
    cap = cv2.VideoCapture(args.camera)
    assert cap.isOpened(), "Could not open camera"

    rep = RepCounter()
    last_angle = None
    last_time = time.time()
    fps = 0.0

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            # Inference
            results = model(frame, verbose=False)[0]
            angle_current = None

            if results.keypoints is not None and len(results.keypoints) > 0:
                # pick first person (single player per client)
                kps = results.keypoints.xy[0].cpu().numpy()  # shape (17, 2)
                # COCO indices: 6=R shoulder, 8=R elbow, 10=R wrist
                r_sh, r_el, r_wr = kps[6], kps[8], kps[10]
                angle_current = angle_deg(r_sh, r_el, r_wr)

                # draw joints
                for pt in (r_sh, r_el, r_wr):
                    cv2.circle(frame, (int(pt[0]), int(pt[1])), 5, (0,255,0), -1)
                cv2.line(frame, (int(r_sh[0]), int(r_sh[1])), (int(r_el[0]), int(r_el[1])), (0,255,0), 2)
                cv2.line(frame, (int(r_el[0]), int(r_el[1])), (int(r_wr[0]), int(r_wr[1])), (0,255,0), 2)

            shared["count"] = rep.update(angle_current)

            # FPS
            now = time.time()
            dt = now - last_time
            if dt > 0:
                fps = 0.9*fps + 0.1*(1.0/dt)
            last_time = now
            cv2.putText(frame, f"{fps:.1f} FPS", (10, frame.shape[0]-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 1, cv2.LINE_AA)

            draw_overlay(frame, shared["count"], angle_current, shared["leaderboard"])
            cv2.imshow("Push-up Client", frame)
            if cv2.waitKey(1) & 0xFF in (27, ord('q')):
                break

    finally:
        shared["running"] = False
        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
