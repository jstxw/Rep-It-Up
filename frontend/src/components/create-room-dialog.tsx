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
import { User, Key, Shuffle, AlertCircle, Loader2 } from "lucide-react";

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
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const randomCode = Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
    setCode(randomCode);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="hidden">Create</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">Create a room</DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            Enter your name and choose a 6-character code for your room.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Player Name Input */}
          <div className="space-y-3">
            <Label htmlFor="player-name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              Player Name
            </Label>
            <Input
              id="player-name"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 text-base bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200"
            />
          </div>

          {/* Room Code Input */}
          <div className="space-y-3">
            <Label htmlFor="room-code" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600" />
              Room Code
            </Label>
            <div className="flex gap-2">
              <Input
                id="room-code"
                placeholder="ABC123"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="h-12 font-mono text-lg tracking-widest uppercase text-center bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200"
                maxLength={6}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generateRandomCode}
                className="h-12 w-12 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors duration-200"
                title="Generate random code"
              >
                <Shuffle className="w-4 h-4 text-emerald-600" />
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11 border-gray-200 hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </Button>
          <Button
            onClick={onCreate}
            disabled={!name.trim() || !code.trim() || pending}
            className="flex-1 h-11 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100 disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Room"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
