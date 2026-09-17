"use client";

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

export function AuthButton({ variant = "primary", isLoading = false, children, className = "", ...props }: AuthButtonProps) {
  const base = "flex h-12 w-full items-center justify-center rounded-full px-4 text-sm font-semibold transition";
  const styles = variant === "primary"
    ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
    : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50";

  return (
    <button className={`${base} ${styles} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? "Please wait..." : children}
    </button>
  );
}
