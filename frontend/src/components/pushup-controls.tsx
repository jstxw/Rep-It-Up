"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Minus, Plus } from "lucide-react"

type Props = {
  currentCount?: number
  onAdd?: (amount: number) => void
  onUndo?: () => void
}

export function PushupControls({ currentCount = 0, onAdd = () => {}, onUndo = () => {} }: Props) {
  const [custom, setCustom] = useState<string>("")

  const commitCustom = () => {
    const n = Number.parseInt(custom, 10)
    if (!Number.isNaN(n) && n > 0) {
      onAdd(n)
      setCustom("")
    }
  }

  return (
    <div className="grid gap-3">
      <div className="text-sm text-muted-foreground">
        Your push-ups: <span className="font-semibold text-foreground">{currentCount}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button onClick={() => onAdd(1)} variant="default">
          <Plus className="size-4 mr-2" />
          +1
        </Button>
        <Button onClick={() => onAdd(5)} variant="secondary">
          +5
        </Button>
        <Button onClick={() => onAdd(10)} variant="secondary">
          +10
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          placeholder="Custom"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitCustom()
            }
          }}
          aria-label="Custom amount"
        />
        <Button onClick={commitCustom} variant="outline">
          Add
        </Button>
        <Button onClick={onUndo} variant="ghost" disabled={currentCount <= 0}>
          <Minus className="size-4 mr-2" />
          Undo
        </Button>
      </div>
    </div>
  )
}
