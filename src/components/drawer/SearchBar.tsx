"use client";

import { useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  presets: readonly string[];
}

/** Search input + keyword preset chips. Autofocuses on mount (drawer open). */
export function SearchBar({ value, onChange, presets }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="drawer-search">
      <input
        ref={inputRef}
        className="drawer-input"
        type="search"
        autoFocus
        value={value}
        placeholder="search stickers…"
        aria-label="Search GIPHY stickers"
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="drawer-presets" role="group" aria-label="Preset searches">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`drawer-preset${value === preset ? " is-active" : ""}`}
            aria-pressed={value === preset}
            onClick={() => {
              onChange(preset);
              inputRef.current?.focus();
            }}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
