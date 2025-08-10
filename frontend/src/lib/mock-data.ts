import type { Room } from "@/hooks/use-pushup-store"
import { generateCode, newId } from "./id"

function avatar(seed: string) {
  return `/placeholder.svg?height=64&width=64&query=${encodeURIComponent(seed)}`
}

export function initialRooms(): Room[] {
  // Pre-baked participants
  const p = (name: string, seed: string, pushups: number): Room["participants"][number] => ({
    id: newId("user"),
    name,
    avatar: avatar(`avatar ${seed}`),
    pushups,
    status: "ready",
  })

  return [
    {
      id: newId("room"),
      name: "Morning Pump Club",
      code: generateCode(),
      goal: 150,
      isActive: false,
      startedAt: null,
      participants: [p("Alex", "alex", 12), p("Mia", "mia", 10), p("Sam", "sam", 8), p("Lee", "lee", 6)],
    },
    {
      id: newId("room"),
      name: "Lunchtime Blitz",
      code: generateCode(),
      goal: 120,
      isActive: true,
      startedAt: Date.now() - 1000 * 60 * 3,
      participants: [p("Priya", "priya", 18), p("Diego", "diego", 14), p("Chen", "chen", 14)],
    },
    {
      id: newId("room"),
      name: "Evening Gain Train",
      code: generateCode(),
      goal: 200,
      isActive: false,
      startedAt: null,
      participants: [p("Nina", "nina", 20), p("Omar", "omar", 15)],
    },
  ]
}
