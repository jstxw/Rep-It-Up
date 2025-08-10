"use client";

import { useEffect, useRef, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Crown, Users, Video, VideoOff } from "lucide-react";
import * as vision from "@mediapipe/tasks-vision";
import { env } from "@/env";
import z from "zod";

type Player = {
  id: string;
  name: string;
  count: number;
};

export default function RoomPage() {
  const params = useParams<{ id: string; name: string }>();
  const router = useRouter();

  const roomId = params.id;
  const playerName = params.name;
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [count, setCount] = useState(0);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pose + WS variables
  const wsRef = useRef<WebSocket | null>(null);
  const poseRef = useRef<vision.PoseLandmarker | null>(null);
  const stageRef = useRef<"UP" | "DOWN">("UP");
  const sentCountRef = useRef(-1);
  const lastSentTsRef = useRef(0);
  const lastTsRef = useRef(0);
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (!roomId) return notFound();
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
    setIsCameraReady(true);
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
  const sendUpdateMaybe = (newCount: number) => {
    const now = performance.now() / 1000;
    if (stoppedRef.current) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (
      newCount !== sentCountRef.current ||
      now - lastSentTsRef.current > 2.0
    ) {
      console.log("[WS]: send, ", newCount);
      wsRef.current.send(JSON.stringify({ type: "update", count: newCount }));
      sentCountRef.current = newCount;
      lastSentTsRef.current = now;
    }
  };

  const SocketDataSchema = z.discriminatedUnion("type", [
    z.object({
      type: z.literal("leaderboard"),
      room: z.string(),
      players: z.array(
        z.object({ id: z.string(), name: z.string(), count: z.number() }),
      ),
    }),
    z.object({
      type: z.literal("join"),
      room: z.string(),
      players: z.array(
        z.object({ id: z.string(), name: z.string(), count: z.number() }),
      ),
    }),
    z.object({
      type: z.literal("leave"),
      room: z.string(),
      players: z.array(
        z.object({ id: z.string(), name: z.string(), count: z.number() }),
      ),
    }),
    z.object({
      type: z.literal("stop"),
      room: z.string(),
      winner: z.object({
        id: z.string(),
        name: z.string(),
        count: z.number(),
      }),
      players: z.array(
        z.object({ id: z.string(), name: z.string(), count: z.number() }),
      ),
    }),
  ]);

  // Connect WebSocket
  const connectWS = (room: string, name: string) => {
    if (wsRef.current)
      try {
        wsRef.current.close();
      } catch {}
    const uri = `${env.NEXT_PUBLIC_BACKEND_URL}/ws/${room}?name=${encodeURIComponent(name)}`;
    wsRef.current = new WebSocket(uri);
    console.log("[WS]: connecting");
    setIsConnected(true);
    wsRef.current.onmessage = (ev) => {
      console.log("[WS]: incoming data: ", ev.data);
      const data = SocketDataSchema.parse(JSON.parse(ev.data as string));
      if (["leaderboard", "join", "leave"].includes(data.type)) {
        setWinnerId(null);
        stoppedRef.current = false;
        setLeaderboard(data.players);
      } else if (data.type === "stop") {
        setLeaderboard(data.players);
        setWinnerId(data.winner.id);
        stoppedRef.current = true;
      }
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
        if (!lms) return;
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

          if (!stoppedRef.current) {
            if (ang < 70 && stageRef.current === "UP") {
              stageRef.current = "DOWN";
            } else if (ang > 160 && stageRef.current === "DOWN") {
              stageRef.current = "UP";
              setCount((p) => {
                sendUpdateMaybe(p + 1);
                return p + 1;
              });
            }
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
    connectWS(roomId, playerName);
    requestAnimationFrame(loop);
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="hover:bg-slate-100"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
              Room #{roomId}
            </div>
            <div className="text-muted-foreground flex items-center gap-1 text-sm">
              <Users className="size-4" />
              {leaderboard.length} participants
            </div>
          </div>
          <div className="ml-auto">
            {!isConnected ? (
              <Button
                onClick={startSession}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Start Session
              </Button>
            ) : (
              <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                Live
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="container mx-auto grid gap-6 px-4 py-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-slate-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {isCameraReady ? (
                    <Video className="size-5 text-emerald-600" />
                  ) : (
                    <VideoOff className="size-5 text-slate-400" />
                  )}
                  Camera Feed
                </CardTitle>
                <div className="text-3xl font-bold text-emerald-600">
                  {count} reps
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <video ref={videoRef} playsInline muted hidden />
              <canvas
                ref={canvasRef}
                className="w-full bg-slate-100 object-cover"
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader className="border-b bg-slate-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown
                    className={`size-5 ${
                      winnerId ? "text-yellow-500" : "text-slate-400"
                    }`}
                  />
                  Leaderboard
                </CardTitle>
                {winnerId && (
                  <div className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                    Winner!
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {leaderboard.map((p, i) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between rounded-lg p-3 transition-colors ${
                      p.id === winnerId
                        ? "bg-yellow-50 text-yellow-900"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-8 items-center justify-center rounded-full font-medium ${
                          i === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : i === 1
                              ? "bg-slate-100 text-slate-600"
                              : "bg-slate-50 text-slate-500"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span className="font-medium">{p.name}</span>
                      {p.id === winnerId && (
                        <Crown className="size-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-lg font-bold">{p.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
