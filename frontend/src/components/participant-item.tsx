"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Participant } from "@/hooks/use-pushup-store"
import { cn } from "@/lib/utils"

type Props = {
  participant?: Participant
  youId?: string
}

const defaultParticipant: Participant = {
  id: "p-1",
  name: "Alex",
  avatar: "/fitness-avatar.png",
  pushups: 0,
  status: "ready",
}

export function ParticipantItem({ participant = defaultParticipant, youId = "you" }: Props) {
  const p = participant
  const you = p.id === youId

  const statusColor =
    p.status === "pushing"
      ? "bg-emerald-100 text-emerald-800"
      : p.status === "resting"
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-100 text-slate-700"

  return (
    <div className={cn("flex items-center justify-between rounded-md border p-2", you && "bg-emerald-50")}>
      <div className="flex items-center gap-3">
        <Avatar className="size-9">
          <AvatarImage src={p.avatar || "/placeholder.svg"} alt={`${p.name}'s avatar`} />
          <AvatarFallback>{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="grid">
          <div className="font-medium">
            {p.name} {you ? "(You)" : ""}
          </div>
          <div>
            <Badge className={statusColor} variant="secondary">
              {p.status === "pushing" ? "Pushing" : p.status === "resting" ? "Resting" : "Ready"}
            </Badge>
          </div>
        </div>
      </div>
      <div className="font-semibold text-right">{p.pushups}</div>
    </div>
  )
}
