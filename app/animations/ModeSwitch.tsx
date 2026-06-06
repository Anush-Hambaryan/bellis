"use client";

import { ReactNode } from "react";

export type Mode = "default" | "sparkle" | "flower" | "cloud";

interface ModeSwitchProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

const MODES: { id: Mode; label: string; icon: ReactNode }[] = [
  {
    id: "default",
    label: "Default",
    icon: <circle cx="12" cy="12" r="6.5" />,
  },
  {
    id: "sparkle",
    label: "Sparkles",
    icon: (
      <>
        <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" />
        <path d="M18.5 15.5l.6 2 2 .6-2 .6-.6 2-.6-2-2-.6 2-.6.6-2Z" />
      </>
    ),
  },
  {
    id: "cloud",
    label: "Clouds",
    icon: (
      <>
        <path d="M7.2 18h9.2a4 4 0 0 0 .6-7.95 5.4 5.4 0 0 0-10.3-1.8A4.9 4.9 0 0 0 7.2 18Z" />
        <path d="M8 21h8" />
      </>
    ),
  },
  {
    id: "flower",
    label: "Flowers",
    icon: (
      <>
        <path d="M12 12c-2.6-2.6-2.6-5.2 0-7.8 2.6 2.6 2.6 5.2 0 7.8Z" />
        <path d="M12 12c2.6-2.6 5.2-2.6 7.8 0-2.6 2.6-5.2 2.6-7.8 0Z" />
        <path d="M12 12c2.6 2.6 2.6 5.2 0 7.8-2.6-2.6-2.6-5.2 0-7.8Z" />
        <path d="M12 12c-2.6 2.6-5.2 2.6-7.8 0 2.6-2.6 5.2-2.6 7.8 0Z" />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      </>
    ),
  },
];

export function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full bg-black/[0.045] p-1">
      {MODES.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          aria-label={item.label}
          title={item.label}
          className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-0 transition-[background-color,color,box-shadow,transform] duration-150 active:scale-95 ${
            mode === item.id
              ? "bg-white text-accent shadow-[0_3px_10px_rgba(0,0,0,0.08)]"
              : "bg-transparent text-accent/70 hover:bg-white/55 hover:text-accent"
          }`}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {item.icon}
          </svg>
        </button>
      ))}
    </div>
  );
}
