"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type DropdownSelectOption = {
  label: string;
  value: string;
  description?: string;
};

type DropdownSelectProps = {
  value: string;
  options: DropdownSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
};

export function DropdownSelect({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder = "Seleccionar...",
  disabled = false,
  className = "",
  buttonClassName = "",
  menuClassName = "",
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"up" | "down">("down");
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => options.find((option) => option.value === value) ?? null, [options, value]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Lógica "Senior" de posicionamiento inteligente
  useEffect(() => {
    if (open && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuHeight = 260; // Max-h-60 (240px) + padding/border

      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        setDirection("up");
      } else {
        setDirection("down");
      }
    }
  }, [open]);

  function choose(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={[
          "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm outline-none transition focus:ring-2",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          open ? "border-starfeet-blue ring-1 ring-starfeet-blue" : "border-gray-200",
          buttonClassName,
        ].join(" ")}
      >
        <span className={`min-w-0 truncate ${selected ? "text-gray-900" : "text-gray-500"}`}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={[
            "absolute z-50 w-full overflow-auto rounded-xl border bg-white p-1 shadow-2xl",
            direction === "up" ? "bottom-full mb-2" : "top-full mt-2",
            "max-h-60", // 240px
            menuClassName,
          ].join(" ")}
        >
          {options.map((option) => {
            const active = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => choose(option.value)}
                className={[
                  "flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition",
                  active ? "bg-starfeet-blue text-white" : "text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                <span className="min-w-0">
                  <span className="block font-medium">{option.label}</span>
                  {option.description ? <span className={`block text-xs ${active ? "text-white/80" : "text-gray-500"}`}>{option.description}</span> : null}
                </span>
                {active ? (
                  <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
                    <path d="M16.5 5.5 8.25 13.75 3.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
