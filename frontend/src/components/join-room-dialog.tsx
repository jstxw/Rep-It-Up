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
import { User, Key, AlertCircle, ArrowRight } from "lucide-react";

type Props = {
  open?: boolean;
  onOpenChange: (open: boolean) => void;
};

export function JoinRoomDialog({ open = false, onOpenChange }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onJoin = async () => {
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

    setPending(true);

    // Simulate brief loading for better UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    setPending(false);
    // Close dialog
    onOpenChange(false);

    // Navigate to room with player name as query param
    router.push(`/room/${trimmedCode}/${encodeURIComponent(trimmedName)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="hidden">Join</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <ArrowRight className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">Join a room</DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            Enter your name and the 6-character room code shared by your friend.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Player Name Input */}
          <div className="space-y-3">
            <Label htmlFor="player-name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Your Name
            </Label>
            <Input
              id="player-name"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 text-base bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
            />
          </div>

          {/* Room Code Input */}
          <div className="space-y-3">
            <Label htmlFor="join-code" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-600" />
              Room Code
            </Label>
            <Input
              id="join-code"
              placeholder="ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="h-12 font-mono text-lg tracking-widest uppercase text-center bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
              maxLength={6}
            />
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
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            onClick={onJoin}
            disabled={!code.trim() || !name.trim() || pending}
            className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100 disabled:opacity-50"
          >
            {pending ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Joining...
              </>
            ) : (
              <>
                Join Room
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
