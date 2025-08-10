"use client";

import { useEffect, useRef, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import * as vision from "@mediapipe/tasks-vision";
import { env } from "@/env";
import z from "zod";

type Player = {
  id: string;
  name: string;
  count: number;
};

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const roomId = params.id;
  const [nameDraft, setNameDraft] = useState("");
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const countRef = useRef(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pose + WS variables
  const wsRef = useRef<WebSocket | null>(null);
  const poseRef = useRef<vision.PoseLandmarker | null>(null);
  const stageRef = useRef<"UP" | "DOWN">("UP");
  const sentCountRef = useRef(-1);
  const lastSentTsRef = useRef(0);
  const lastTsRef = useRef(0);

  useEffect(() => {
    if (!roomId) return notFound();
    setNameDraft("Player"); // default
  }, [roomId]);

  // Setup camera
  const setupCamera = async () => {
    if (!videoRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
    console.log("[WEBCAM]: loaded");
  };

  // Setup Mediapipe Pose
  const setupPose = async () => {
    const { FilesetResolver, PoseLandmarker } = vision;
    const fileset = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm",
    );
    poseRef.current = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
      },
      runningMode: "VIDEO",
      numPoses: 1,
    });
    console.log("[MODEL] loaded");
  };

  // Angle helper
  const angleDeg = (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
  ) => {
    const baxx = ax - bx,
      baxy = ay - by;
    const bcx = cx - bx,
      bcy = cy - by;
    const nba = Math.hypot(baxx, baxy) || 1;
    const nbc = Math.hypot(bcx, bcy) || 1;
    const dot = (baxx / nba) * (bcx / nbc) + (baxy / nba) * (bcy / nbc);
    const clamped = Math.max(-1, Math.min(1, dot));
    return (Math.acos(clamped) * 180) / Math.PI;
  };

  // Send WS update
  const sendUpdateMaybe = () => {
    const now = performance.now() / 1000;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (
      countRef.current !== sentCountRef.current ||
      now - lastSentTsRef.current > 2.0
    ) {
      console.log("[WS]: send, ", countRef.current);
      wsRef.current.send(
        JSON.stringify({ type: "update", count: countRef.current }),
      );
      sentCountRef.current = countRef.current;
      lastSentTsRef.current = now;
    }
  };

  const SocketDataSchema = z.object({
    type: z.string(),
    room: z.string(),
    players: z.object({
      id: z.string(),
      name: z.string(),
      count: z.number(),
    }),
  });

  // Connect WebSocket
  const connectWS = (room: string, name: string) => {
    if (wsRef.current)
      try {
        wsRef.current.close();
      } catch {}
    const uri = `${env.NEXT_PUBLIC_BACKEND_URL}/ws/${room}?name=${encodeURIComponent(name)}`;
    wsRef.current = new WebSocket(uri);
    console.log("[WS]: connecting");
    wsRef.current.onmessage = (ev) => {
      console.log("[WS]: incoming data: ", ev.data);
      try {
        const data = SocketDataSchema.parse(ev.data);
        if (["leaderboard", "join", "leave"].includes(data.type)) {
          setLeaderboard(Array.isArray(data.players) ? data.players : []);
        }
      } catch {}
    };
  };

  // Main loop
  const loop = () => {
    // Wrap async logic in an IIFE
    void (async () => {
      if (!videoRef.current || !canvasRef.current || !poseRef.current) {
        requestAnimationFrame(loop);
        return;
      }

      const ctx = canvasRef.current.getContext("2d");
      const vw = videoRef.current.videoWidth;
      const vh = videoRef.current.videoHeight;
      if (vw === 0 || vh === 0) {
        requestAnimationFrame(loop);
        return;
      }

      if (canvasRef.current.width !== vw || canvasRef.current.height !== vh) {
        canvasRef.current.width = vw;
        canvasRef.current.height = vh;
      }

      const now = performance.now();
      const res = poseRef.current.detectForVideo(videoRef.current, now);
      ctx?.drawImage(videoRef.current, 0, 0, vw, vh);

      if (res.landmarks && res.landmarks.length > 0) {
        const lms = res.landmarks[0];
        const s = lms[12],
          e = lms[14],
          w = lms[16];
        if (s && e && w) {
          const sx = s.x * vw,
            sy = s.y * vh;
          const ex = e.x * vw,
            ey = e.y * vh;
          const wx = w.x * vw,
            wy = w.y * vh;
          const ang = angleDeg(sx, sy, ex, ey, wx, wy);

          if (ang < 70 && stageRef.current === "UP") {
            stageRef.current = "DOWN";
          } else if (ang > 160 && stageRef.current === "DOWN") {
            stageRef.current = "UP";
            countRef.current += 1;
            sendUpdateMaybe();
          }
        }
      }

      lastTsRef.current = now;
      requestAnimationFrame(loop);
    })();
  };

  // Start session
  const startSession = async () => {
    await setupCamera();
    await setupPose();
    connectWS(roomId, nameDraft);
    requestAnimationFrame(loop);
  };

  return (
    <main className="min-h-[100dvh]">
      <header className="border-b">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ChevronLeft className="size-5" />
          </Button>
          <div className="font-semibold">Room {roomId}</div>
          <div className="ml-auto flex items-center gap-2">
            <Button onClick={startSession}>Connect & Start</Button>
          </div>
        </div>
      </header>

      <section className="container mx-auto grid gap-6 px-4 py-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Push-up Counter</CardTitle>
            </CardHeader>
            <CardContent>
              <video ref={videoRef} playsInline muted hidden />
              <canvas ref={canvasRef} />
              <div className="mt-2 font-bold">Reps: {countRef.current}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.map((p, i) => (
                <div key={p.id} className="flex justify-between">
                  <span>
                    {i + 1}. {p.name}
                  </span>
                  <span>{p.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
