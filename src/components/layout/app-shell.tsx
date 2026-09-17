"use client";

import { AppLayout } from "@/components/layout/app-layout";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
