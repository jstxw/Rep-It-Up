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

export function JoinRoomDialog({ open = false, onOpenChange = () => {} }: Props) {
  const router = useRouter()
  const { joinRoomByCode } = usePushupStore()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const onJoin = () => {
    setError(null)
    const c = code.trim().toUpperCase()
    if (!c) return
    const room = joinRoomByCode(c)
    if (!room) {
      setError("Room not found. Check the code and try again.")
      return
    }
    onOpenChange(false)
    router.push(`/room/${room.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="hidden">Join</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a room</DialogTitle>
          <DialogDescription>Enter the 6-character code shared by your friend.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label htmlFor="join-code">Room code</Label>
            <Input
              id="join-code"
              placeholder="ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="uppercase tracking-widest font-mono"
              maxLength={6}
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onJoin} disabled={!code.trim()}>
            Join
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
