"use client"

import Link from "next/link"
import { Users, Bolt } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Room } from "@/hooks/use-pushup-store"

type Props = {
  room?: Room
}

const defaultRoom: Room = {
  id: "room-default",
  name: "Sample Room",
  code: "ABC123",
  goal: 100,
  isActive: false,
  startedAt: null,
  participants: [],
}

export function RoomCard({ room = defaultRoom }: Props) {
  const total = room.participants.reduce((acc, p) => acc + p.pushups, 0)

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{room.name}</CardTitle>
          <Badge variant={room.isActive ? "default" : "secondary"}>{room.isActive ? "Active" : "Paused"}</Badge>
          <Badge variant="outline" className="ml-auto font-mono">
            Code: {room.code}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-3 text-xs mt-1">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {room.participants.length} joined
          </span>
          <span className="flex items-center gap-1">
            <Bolt className="size-3.5 text-emerald-600" />
            {total} total
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        Team goal: <span className="font-medium">{room.goal ?? 100}</span>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button asChild className="w-full">
          <Link href={`/room/${room.id}`}>Open</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
