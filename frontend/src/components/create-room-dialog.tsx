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

export function CreateRoomDialog({ open = false, onOpenChange }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCreate = async () => {
    setError(null);
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (!trimmedCode) {
      setError("Please choose a valid room code.");
      return;
    }

    setPending(true);

    await new Promise((resolve) => setTimeout(resolve, 300));

    setPending(false);
    onOpenChange(false);

    // Navigate to the room with player name as query param
    router.push(`/room/${trimmedCode}/${encodeURIComponent(trimmedName)}`);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomCode = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setCode(randomCode);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="hidden">Create</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a room</DialogTitle>
          <DialogDescription>
            Enter your name and choose a 6-character code for your room.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          {/* Player Name Input */}
          <div className="grid gap-2">
            <Label htmlFor="player-name">Player Name</Label>
            <Input
              id="player-name"
              placeholder="Thomas"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Room Code Input */}
          <div className="grid gap-2">
            <Label htmlFor="room-code">Room Code</Label>
            <div className="flex gap-2">
              <Input
                id="room-code"
                placeholder="ABC123"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono tracking-widest uppercase"
                maxLength={6}
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateRandomCode}
                disabled={pending}
                className="whitespace-nowrap"
              >
                Random
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onCreate}
            disabled={!name.trim() || !code.trim() || pending}
          >
            {pending ? "Creating..." : "Create Room"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
