"use client";

import { QueryProvider } from "./query-provider";
import { ToastProvider } from "./toast-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>{children}</ToastProvider>
    </QueryProvider>
  );
}
