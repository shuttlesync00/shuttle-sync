"use client";

import { createContext, useContext } from "react";

interface ToastOptions {
  title: string;
  description?: string;
  type?: "success" | "error" | "info";
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  toast: () => undefined,
});

export function useToast() {
  return useContext(ToastContext);
}
