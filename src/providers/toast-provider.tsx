"use client";

import { ToastContext } from "@/hooks/use-toast";
import { useMemo, useState } from "react";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      toast: ({ title, description, type = "info" }: { title: string; description?: string; type?: "success" | "error" | "info" }) => {
        const prefix = type === "success" ? "✅" : type === "error" ? "⚠️" : "ℹ️";
        setMessage(`${prefix} ${title}${description ? ` — ${description}` : ""}`);
        window.setTimeout(() => setMessage(null), 4000);
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <div className="fixed bottom-4 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg">
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
