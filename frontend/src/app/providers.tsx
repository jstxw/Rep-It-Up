"use client";

import type React from "react";

import { PushupProvider } from "@/hooks/use-pushup-store";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <PushupProvider>{children}</PushupProvider>;
}
