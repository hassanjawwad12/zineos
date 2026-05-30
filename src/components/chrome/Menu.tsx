"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface MenuItemDef {
  label: string;
  onSelect: () => void;
  shortcut?: string;
  disabled?: boolean;
}

/** A separator between menu items. */
export const MENU_SEP = "---" as const;

interface MenuProps {
  label: string;
  items: (MenuItemDef | typeof MENU_SEP)[];
}

/**
 * A single dropdown menu (one of the menu-bar entries). Closes on outside
 * pointerdown, Escape, or after a selection. Lightweight by design — full
 * arrow-key menu traversal is out of scope; items are tab-focusable buttons.
 */
export function Menu({ label, items }: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const popId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="menu" ref={ref}>
      <button
        type="button"
        className="menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open && (
        <ul className="menu-pop" id={popId} role="menu" aria-label={label}>
          {items.map((item, i) =>
            item === MENU_SEP ? (
              <li key={`sep-${i}`} className="menu-sep" role="separator" />
            ) : (
              <li key={item.label} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="menu-item"
                  disabled={item.disabled}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                >
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <span className="shortcut">{item.shortcut}</span>
                  )}
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
