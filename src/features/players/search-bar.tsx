"use client";

import { useState } from "react";

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value = "", onChange, placeholder = "Search players" }: SearchBarProps) {
  const [query, setQuery] = useState(value);

  return (
    <label className="block text-sm">
      <span className="sr-only">Search</span>
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          onChange?.(event.target.value);
        }}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-base outline-none transition focus:border-emerald-500 focus:bg-white"
      />
    </label>
  );
}
