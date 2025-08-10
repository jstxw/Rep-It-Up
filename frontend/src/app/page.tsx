"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Plus, Users, Bolt, Search, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { usePushupStore } from "@/hooks/use-pushup-store"
import { CreateRoomDialog } from "@/components/create-room-dialog"
import { JoinRoomDialog } from "@/components/join-room-dialog"

export default function Page() {
  const { rooms, you } = usePushupStore()
  const [query, setQuery] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return rooms
    return rooms.filter((r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
  }, [rooms, query])

  useEffect(() => {
    // Ensure a default name for "you"
    // You can update it inside a room header
    // noop here on mount
  }, [])

  const activeCount = rooms.filter((r) => r.isActive).length

  return (
    <main className="min-h-[100dvh] flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Bolt className="size-6 text-emerald-600" aria-hidden="true" />
          <Link href="/" className="font-bold text-lg">
            PushUp
          </Link>
          <Badge variant="secondary" className="ml-1">
            Mock
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={() => setJoinOpen(true)}>
              Join by code
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4 mr-2" />
              Create room
            </Button>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8 grid gap-6">
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-center">
          <div className="grid gap-4">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Do push-ups together, anywhere.</h1>
            <p className="text-muted-foreground max-w-[55ch]">
              Create a room, invite friends, and track your push-ups in real time. Start a quick session or compete on
              the leaderboard. No signup needed—this demo uses mock data.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4 mr-2" />
                Create a room
              </Button>
              <Button size="lg" variant="outline" onClick={() => setJoinOpen(true)}>
                Join by code
              </Button>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-2">
                <Users className="size-4" aria-hidden="true" />
                <span>{rooms.reduce((acc, r) => acc + r.participants.length, 0)} participants</span>
              </div>
              <div className="flex items-center gap-2">
                <Bolt className="size-4 text-emerald-600" aria-hidden="true" />
                <span>
                  {activeCount} active session{activeCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          <Card className="border-emerald-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="size-5 text-emerald-600" aria-hidden="true" />
                Leader tips
              </CardTitle>
              <CardDescription>How to run a better group session</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>• Set a clear goal (e.g., 100 total or AMRAP in 5 minutes)</div>
              <div>• Start the timer so everyone stays in sync</div>
              <div>• Cheer teammates and keep rest short</div>
              <div>• Keep the form clean—quality over quantity!</div>
            </CardContent>
            <CardFooter></CardFooter>
          </Card>
        </div>

        <Separator />

        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-md">
            <Search
              className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rooms by name or code"
              className="pl-8"
              aria-label="Search rooms"
            />
          </div>
          <div className="ml-auto text-sm text-muted-foreground">
            Logged in as: <span className="font-medium">{you.name}</span>
          </div>
        </div>
      </section>

      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} />
      <JoinRoomDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </main>
  )
}
