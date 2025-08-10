"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { notFound, useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { usePushupStore } from "@/hooks/use-pushup-store"
import { ParticipantItem } from "@/components/participant-item"
import { PushupControls } from "@/components/pushup-controls"
import { Copy, Timer, Users, ChevronLeft, Play, Square } from "lucide-react"

export default function RoomPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { getRoomById, you, joinRoomById, toggleSession, incrementYourPushups, setYourName, upsertRoom } =
    usePushupStore()
  const [copied, setCopied] = useState(false)
  const [nameDraft, setNameDraft] = useState("")
  const [joined, setJoined] = useState(false)
  const room = getRoomById(params.id)

  useEffect(() => {
    if (!room) {
      return notFound()
    }
    setNameDraft(room.name)
  }, [room])

  useEffect(() => {
    if (!room) return
    if (!room.participants.some((p) => p.id === you.id)) {
      joinRoomById(room.id)
      setJoined(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, you.id])

  // Pseudo-realtime: other participants push randomly when active
  const tickRef = useRef<number | null>(null)
  useEffect(() => {
    if (!room || !room.isActive) {
      if (tickRef.current) {
        window.clearInterval(tickRef.current)
        tickRef.current = null
      }
      return
    }
    if (tickRef.current) return
    tickRef.current = window.setInterval(() => {
      const updated = { ...room }
      let changed = false
      updated.participants = updated.participants.map((p) => {
        if (p.id === you.id) return p
        // 50% chance to add 1-3 pushups
        if (Math.random() < 0.5) {
          const inc = 1 + Math.floor(Math.random() * 3)
          changed = true
          return { ...p, pushups: p.pushups + inc, status: "pushing" }
        }
        // 20% chance resting
        if (Math.random() < 0.2) {
          return { ...p, status: "resting" }
        }
        return { ...p, status: "ready" }
      })
      if (changed) {
        upsertRoom(updated)
      }
    }, 1500)

    return () => {
      if (tickRef.current) {
        window.clearInterval(tickRef.current)
        tickRef.current = null
      }
    }
  }, [room, upsertRoom, you.id])

  const leaderboard = useMemo(() => {
    return [...(room?.participants || [])].sort((a, b) => b.pushups - a.pushups)
  }, [room?.participants])

  const goal = room?.goal ?? 100
  const total = room?.participants.reduce((acc, p) => acc + p.pushups, 0) ?? 0
  const percent = Math.min(100, Math.round((total / goal) * 100))

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(room?.code || "")
      setCopied(true)
      setTimeout(() => setCopied(false), 1000)
    } catch {
      setCopied(false)
    }
  }

  if (!room) {
    return notFound()
  }

  return (
    <main className="min-h-[100dvh]">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ChevronLeft className="size-5" />
            <span className="sr-only">Back</span>
          </Button>
          <div className="font-semibold">{room.name}</div>
          <Badge variant={room.isActive ? "default" : "secondary"} className="ml-2">
            {room.isActive ? "Active" : "Paused"}
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              Code: {room.code}
            </Badge>
            <Button variant="outline" size="icon" onClick={onCopy} aria-label="Copy room code">
              <Copy className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-6 grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="grid gap-4">
          <Card>
            <CardHeader className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Timer className="size-4 text-emerald-600" aria-hidden="true" />
                <CardTitle>Session</CardTitle>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={room.isActive ? "destructive" : "default"}
                    onClick={() => toggleSession(room.id)}
                  >
                    {room.isActive ? (
                      <>
                        <Square className="size-4 mr-2" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="size-4 mr-2" />
                        Start
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">
                  Goal: <span className="font-medium">{goal}</span> total push-ups
                </div>
                <div className="text-sm text-muted-foreground">
                  Team: <span className="font-medium">{room.participants.length}</span> people
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">Team total</div>
                <div className="font-semibold">{total}</div>
              </div>
              <Progress value={percent} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {percent}% of {goal}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4 text-emerald-600" aria-hidden="true" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {room.participants.map((p) => (
                <ParticipantItem key={p.id} participant={p} youId={you.id} />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Your controls</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={you.avatar || "/placeholder.svg"} alt="Your avatar" />
                  <AvatarFallback>YOU</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <div className="font-semibold">{you.name}</div>
                  <div className="text-xs text-muted-foreground">Change your display name</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="Your name"
                  aria-label="Your name"
                />
                <Button variant="outline" onClick={() => setYourName(nameDraft)} disabled={!nameDraft.trim()}>
                  Save
                </Button>
              </div>

              <Separator />

              <PushupControls
                onAdd={(n) => incrementYourPushups(room.id, n)}
                onUndo={() => incrementYourPushups(room.id, -1)}
                currentCount={room.participants.find((p) => p.id === you.id)?.pushups ?? 0}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {leaderboard.map((p, i) => {
                const rank = i + 1
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between rounded-md border p-2",
                      p.id === you.id && "bg-emerald-50",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-6 text-right font-mono",
                          rank <= 3 ? "text-emerald-700" : "text-muted-foreground",
                        )}
                      >
                        {rank}
                      </div>
                      <Avatar className="size-8">
                        <AvatarImage src={p.avatar || "/placeholder.svg"} alt={`${p.name}'s avatar`} />
                        <AvatarFallback>{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">
                        {p.name}
                        {p.id === you.id ? " (You)" : ""}
                      </div>
                    </div>
                    <div className="font-semibold">{p.pushups}</div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
