"use client";

import { useEffect, useRef, useState } from "react";

export type LanguageProficiency = "beginner" | "intermediate" | "advanced";

const LANGUAGE_PROFICIENCY_STORAGE_KEY = "languageProficiency";
const LANGUAGE_PROFICIENCY_OPTIONS = new Set<LanguageProficiency>([
  "beginner",
  "intermediate",
  "advanced",
]);
const languageProficiencyChoices: { value: LanguageProficiency; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export function isLanguageProficiency(value: unknown): value is LanguageProficiency {
  return typeof value === "string" && LANGUAGE_PROFICIENCY_OPTIONS.has(value as LanguageProficiency);
}

export function getStoredLanguageProficiency(): LanguageProficiency {
  if (typeof window === "undefined") return "intermediate";

  try {
    const savedLanguageProficiency = window.localStorage.getItem(LANGUAGE_PROFICIENCY_STORAGE_KEY);
    return isLanguageProficiency(savedLanguageProficiency) ? savedLanguageProficiency : "intermediate";
  } catch {
    return "intermediate";
  }
}

export function LanguageProficiencySelect({
  value,
  onChange,
  disabled = false,
}: {
  value: LanguageProficiency;
  onChange: (value: LanguageProficiency) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = languageProficiencyChoices.find((option) => option.value === value) ?? languageProficiencyChoices[1];

  useEffect(() => {
    if (!open) return;

    function closeMenu(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function selectLanguageProficiency(nextLanguageProficiency: LanguageProficiency) {
    onChange(nextLanguageProficiency);
    setOpen(false);

    try {
      window.localStorage.setItem(LANGUAGE_PROFICIENCY_STORAGE_KEY, nextLanguageProficiency);
    } catch {
      // Ignore blocked storage; the in-memory selection still works.
    }
  }

  return (
    <div ref={menuRef} className="relative shrink-0 text-text-mid">
      <button
        type="button"
        aria-label="Language proficiency tier"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (!disabled) setOpen((current) => !current);
        }}
        disabled={disabled}
        className="flex h-8 min-w-[116px] items-center justify-between gap-2 rounded-full border-0 bg-content py-0 pl-[13px] pr-3 text-left text-[11px] font-bold text-text-mid outline-none transition-colors enabled:cursor-pointer enabled:hover:bg-accent-soft enabled:hover:text-accent disabled:cursor-default disabled:opacity-65"
      >
        <span>{selected.label}</span>
        <svg
          className={`shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-44 overflow-hidden rounded-[16px] border border-black/[0.07] bg-card p-1.5 text-text-main shadow-[0_16px_48px_rgba(0,0,0,0.14),0_4px_16px_rgba(0,0,0,0.08)]"
        >
          {languageProficiencyChoices.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => selectLanguageProficiency(option.value)}
                className={`flex h-10 w-full items-center gap-2 rounded-[12px] px-3 text-left text-[13px] font-bold transition-colors ${
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-text-mid hover:bg-content hover:text-text-main"
                }`}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {active && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
