"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface ShuttleSelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ShuttleSelect({
  label,
  value,
  options,
  onValueChange,
  placeholder,
  disabled = false,
  className = "",
}: ShuttleSelectProps) {
  const [open, setOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  const selectedOption = options.find((option) => option.value === value) ?? null;

  useEffect(() => {
    if (!open || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const menuHeight = Math.min(options.length * 48 + 16, 260);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    setOpenAbove(spaceBelow < menuHeight && spaceAbove > menuHeight);
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }

      const enabledOptions = options.filter((option) => !option.disabled);
      const currentIndex = enabledOptions.findIndex((option) => option.value === value);
      const nextIndex = event.key === "ArrowDown"
        ? (currentIndex + 1 + enabledOptions.length) % enabledOptions.length
        : event.key === "ArrowUp"
          ? (currentIndex - 1 + enabledOptions.length) % enabledOptions.length
          : 0;

      const nextValue = enabledOptions[nextIndex]?.value;
      if (nextValue) {
        onValueChange(nextValue);
      }
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={`relative text-sm ${className}`}>
      <label className="block">
        <span className="mb-2 block font-medium text-zinc-700">{label}</span>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          onClick={() => !disabled && setOpen((current) => !current)}
          className="flex h-12 w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 pr-11 text-left text-base font-medium text-zinc-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
        >
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder ?? "Select an option"}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </label>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label}
          className={`absolute z-50 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)] ${openAbove ? "bottom-full mb-2" : "top-full mt-2"}`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => {
                  if (!option.disabled) {
                    onValueChange(option.value);
                    setOpen(false);
                  }
                }}
                className={`flex h-12 w-full items-center justify-between gap-3 px-4 text-left text-sm transition ${isSelected ? "bg-emerald-50 text-emerald-700" : "text-zinc-700 hover:bg-zinc-50"} ${option.disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
