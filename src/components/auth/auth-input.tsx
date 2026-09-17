"use client";

import { forwardRef } from "react";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  endAdornment?: React.ReactNode;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(function AuthInput({ label, error, className = "", endAdornment, ...props }, ref) {
  return (
    <label className="block text-sm">
      <span className="mb-2 block font-medium text-zinc-700">{label}</span>
      <div className="relative">
        <input
          ref={ref}
          className={`h-12 w-full rounded-2xl border bg-zinc-50 px-4 pr-12 text-base outline-none transition focus:border-emerald-500 focus:bg-white ${error ? "border-red-400" : "border-zinc-200"} ${className}`}
          {...props}
        />
        {endAdornment ? <div className="absolute inset-y-0 right-3 flex items-center">{endAdornment}</div> : null}
      </div>
      {error ? <span className="mt-2 block text-sm text-red-500">{error}</span> : null}
    </label>
  );
});
