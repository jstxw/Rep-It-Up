"use client"

import type React from "react"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { generateCode, newId } from "@/lib/id"
import { initialRooms } from "@/lib/mock-data"

export type Participant = {
  id: string
  name: string
  avatar: string
  pushups: number
  status?: "ready" | "resting" | "pushing"
}

export type Room = {
  id: string
  name: string
  code: string
  goal?: number
  isActive: boolean
  startedAt: number | null
  participants: Participant[]
}

export type You = {
  id: string
  name: string
  avatar: string
}

type Store = {
  rooms: Room[]
  you: You
  // queries
  getRoomById: (id: string) => Room | null
  getRoomByCode: (code: string) => Room | null
  // mutations
  upsertRoom: (room: Room) => void
  createRoom: (name: string, goal?: number) => Room
  joinRoomByCode: (code: string) => Room | null
  joinRoomById: (roomId: string) => Room | null
  toggleSession: (roomId: string) => void
  incrementYourPushups: (roomId: string, delta: number) => void
  setYourName: (name: string) => void
}

const PushupContext = createContext<Store | null>(null)

const LS_ROOMS = "pushup.rooms.v1"
const LS_YOU = "pushup.you.v1"

function loadRooms(): Room[] {
  try {
    const raw = localStorage.getItem(LS_ROOMS)
    if (!raw) return initialRooms()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return initialRooms()
    return parsed
  } catch {
    return initialRooms()
  }
}

function loadYou(): You {
  try {
    const raw = localStorage.getItem(LS_YOU)
    if (raw) return JSON.parse(raw)
  } catch {}
  const you: You = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `you-${Math.random().toString(36).slice(2)}`,
    name: "You",
    avatar: "/ai-avatar.png",
  }
  try {
    localStorage.setItem(LS_YOU, JSON.stringify(you))
  } catch {}
  return you
}

export function PushupProvider({ children }: { children: React.ReactNode }) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [you, setYou] = useState<You>(loadYou)

  useEffect(() => {
    setRooms(loadRooms())
  }, [])

  // persist rooms
  useEffect(() => {
    try {
      localStorage.setItem(LS_ROOMS, JSON.stringify(rooms))
    } catch {}
  }, [rooms])

  // persist you
  useEffect(() => {
    try {
      localStorage.setItem(LS_YOU, JSON.stringify(you))
    } catch {}
  }, [you])

  const getRoomById = useCallback((id: string) => rooms.find((r) => r.id === id) ?? null, [rooms])
  const getRoomByCode = useCallback(
    (code: string) => rooms.find((r) => r.code.toUpperCase() === code.toUpperCase()) ?? null,
    [rooms],
  )

  const upsertRoom = useCallback((room: Room) => {
    setRooms((prev) => {
      const idx = prev.findIndex((r) => r.id === room.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = room
        return next
      }
      return [room, ...prev]
    })
  }, [])

  const ensureYouInRoom = useCallback(
    (room: Room): Room => {
      if (room.participants.some((p) => p.id === you.id)) return room
      return {
        ...room,
        participants: [
          ...room.participants,
          {
            id: you.id,
            name: you.name,
            avatar: you.avatar,
            pushups: 0,
            status: "ready",
          },
        ],
      }
    },
    [you],
  )

  const createRoom = useCallback(
    (name: string, goal?: number) => {
      const room: Room = {
        id: newId("room"),
        name,
        code: generateCode(),
        goal: goal ?? 100,
        isActive: false,
        startedAt: null,
        participants: [
          {
            id: you.id,
            name: you.name,
            avatar: you.avatar,
            pushups: 0,
            status: "ready",
          },
        ],
      }
      setRooms((prev) => [room, ...prev])
      return room
    },
    [you],
  )

  const joinRoomByCode = useCallback(
    (code: string) => {
      const found = rooms.find((r) => r.code.toUpperCase() === code.toUpperCase())
      if (!found) return null
      const updated = ensureYouInRoom(found)
      upsertRoom(updated)
      return updated
    },
    [rooms, ensureYouInRoom, upsertRoom],
  )

  const joinRoomById = useCallback(
    (roomId: string) => {
      const found = rooms.find((r) => r.id === roomId)
      if (!found) return null
      const updated = ensureYouInRoom(found)
      upsertRoom(updated)
      return updated
    },
    [rooms, ensureYouInRoom, upsertRoom],
  )

  const toggleSession = useCallback((roomId: string) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId ? { ...r, isActive: !r.isActive, startedAt: !r.isActive ? Date.now() : r.startedAt } : r,
      ),
    )
  }, [])

  const incrementYourPushups = useCallback(
    (roomId: string, delta: number) => {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id !== roomId) return r
          const nextParticipants = r.participants.map((p) => {
            if (p.id !== you.id) return p
            const next = Math.max(0, p.pushups + delta)
            return { ...p, pushups: next, status: delta > 0 ? "pushing" : p.status }
          })
          return { ...r, participants: nextParticipants }
        }),
      )
    },
    [you.id],
  )

  const setYourName = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      setYou((prev) => ({ ...prev, name: trimmed }))
      // update name in rooms
      setRooms((prev) =>
        prev.map((r) => ({
          ...r,
          participants: r.participants.map((p) => (p.id === you.id ? { ...p, name: trimmed } : p)),
        })),
      )
    },
    [you.id],
  )

  const value: Store = useMemo(
    () => ({
      rooms,
      you,
      getRoomById,
      getRoomByCode,
      upsertRoom,
      createRoom,
      joinRoomByCode,
      joinRoomById,
      toggleSession,
      incrementYourPushups,
      setYourName,
    }),
    [
      rooms,
      you,
      getRoomById,
      getRoomByCode,
      upsertRoom,
      createRoom,
      joinRoomByCode,
      joinRoomById,
      toggleSession,
      incrementYourPushups,
      setYourName,
    ],
  )

  return <PushupContext.Provider value={value}>{children}</PushupContext.Provider>
}

export function usePushupStore() {
  const ctx = useContext(PushupContext)
  if (!ctx) {
    // If used outside provider (shouldn't happen in Next.js default layout), create a fallback minimalist store
    const fallback: Store = {
      rooms: initialRooms(),
      you: { id: "you-fallback", name: "You", avatar: "/ai-avatar.png" },
      getRoomById: () => null,
      getRoomByCode: () => null,
      upsertRoom: () => {},
      createRoom: (name: string) => ({
        id: newId("room"),
        name,
        code: generateCode(),
        goal: 100,
        isActive: false,
        startedAt: null,
        participants: [],
      }),
      joinRoomByCode: () => null,
      joinRoomById: () => null,
      toggleSession: () => {},
      incrementYourPushups: () => {},
      setYourName: () => {},
    }
    return fallback
  }
  return ctx
}
