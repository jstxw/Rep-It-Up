"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open?: boolean;
  onOpenChange: (open: boolean) => void;
};

export function JoinRoomDialog({ open = false, onOpenChange }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onJoin = () => {
    setError(null);
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (!trimmedCode) {
      setError("Please enter a valid room code.");
      return;
    }

    // Close dialog
    onOpenChange(false);

    // Navigate to room with player name as query param
    router.push(`/room/${trimmedCode}?name=${encodeURIComponent(trimmedName)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="hidden">Join</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a room</DialogTitle>
          <DialogDescription>
            Enter your name and the 6-character room code shared by your friend.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          {/* Player Name Input */}
          <div className="grid gap-2">
            <Label htmlFor="player-name">Your Name</Label>
            <Input
              id="player-name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Room Code Input */}
          <div className="grid gap-2">
            <Label htmlFor="join-code">Room Code</Label>
            <Input
              id="join-code"
              placeholder="ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono tracking-widest uppercase"
              maxLength={6}
            />
          </div>

          {/* Error Message */}
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onJoin} disabled={!code.trim() || !name.trim()}>
            Join
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
