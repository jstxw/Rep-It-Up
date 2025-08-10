"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePushupStore } from "@/hooks/use-pushup-store"

type Props = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateRoomDialog({ open = false, onOpenChange = () => {} }: Props) {
  const router = useRouter()
  const { createRoom } = usePushupStore()
  const [name, setName] = useState("")
  const [goal, setGoal] = useState<string>("100")
  const [pending, setPending] = useState(false)

  const onCreate = async () => {
    if (!name.trim()) return
    const parsedGoal = Math.max(10, Number.parseInt(goal || "100", 10) || 100)
    setPending(true)
    const room = createRoom(name.trim(), parsedGoal)
    setPending(false)
    onOpenChange(false)
    router.push(`/room/${room.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="hidden">Create</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a room</DialogTitle>
          <DialogDescription>Set a name and optional goal for your team session.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label htmlFor="room-name">Room name</Label>
            <Input
              id="room-name"
              placeholder="Morning Pump Club"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="room-goal">Team goal (total push-ups)</Label>
            <Input id="room-goal" type="number" min={10} value={goal} onChange={(e) => setGoal(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onCreate} disabled={!name.trim() || pending}>
            {pending ? "Creating..." : "Create room"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
