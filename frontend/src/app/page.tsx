"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Users, Bolt, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateRoomDialog } from "@/components/create-room-dialog";
import { JoinRoomDialog } from "@/components/join-room-dialog";

export default function Page() {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-white to-emerald-50">
      <header className="sticky top-0 border-b bg-white/80 backdrop-blur-sm">
        <nav className="container mx-auto flex items-center gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <Bolt className="size-6 text-emerald-600" aria-hidden="true" />
            <Link href="/" className="text-xl font-bold tracking-tight">
              PushUp
            </Link>
            <Badge variant="secondary" className="ml-1">
              Alpha
            </Badge>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Button variant="ghost" onClick={() => setJoinOpen(true)}>
              Join Room
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" /> New Room
            </Button>
          </div>
        </nav>
      </header>

      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div className="flex flex-col justify-center space-y-6">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Transform your{" "}
              <span className="text-emerald-600">fitness journey</span> together
            </h1>
            <p className="text-muted-foreground text-lg">
              Join the community of fitness enthusiasts. Create rooms, challenge
              friends, and track push-ups in real-time. No signup required.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setCreateOpen(true)}
              >
                Start Your Challenge <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setJoinOpen(true)}
              >
                Join Existing Room
              </Button>
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Users className="size-4" />
                <span>1,234+ active users</span>
              </div>
              <div className="flex items-center gap-2">
                <Bolt className="size-4 text-emerald-600" />
                <span>500+ daily sessions</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="border-2 border-emerald-100 bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="size-5 text-emerald-600" />
                  Pro Tips
                </CardTitle>
                <CardDescription>
                  Maximize your group workout session
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {[
                  "Set challenging but achievable goals",
                  "Use the built-in timer for synchronized workouts",
                  "Encourage and motivate your teammates",
                  "Focus on proper form and technique",
                  "Track progress with our leaderboard system",
                ].map((tip, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm"
                  >
                    <div className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-600">
                      {i + 1}
                    </div>
                    <p>{tip}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} />
      <JoinRoomDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </main>
  );
}
