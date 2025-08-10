"use client"

import Link from "next/link"
import { Bolt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type Props = {
  onCreate?: () => void
  onJoin?: () => void
}

export function SiteHeader({ onCreate = () => {}, onJoin = () => {} }: Props) {
  return (
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
          <Button variant="outline" onClick={onJoin}>
            Join by code
          </Button>
          <Button onClick={onCreate}>Create room</Button>
        </div>
      </div>
    </header>
  )
}
