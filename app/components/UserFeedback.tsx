"use client";

import { useState } from "react";

export type FeedbackKind = "text" | "markdown" | "flashcard";

type FeedbackValue = 0 | 1;

type FeedbackState = {
  value?: FeedbackValue;
  pending?: FeedbackValue;
  error?: boolean;
};

export function UserFeedback({
  messageId,
  traceId,
  sessionId,
  userEmail,
  kind,
}: {
  messageId: string;
  traceId: string;
  sessionId: string;
  userEmail?: string;
  kind: FeedbackKind;
}) {
  const [state, setState] = useState<FeedbackState>();

  async function submitFeedback(value: FeedbackValue) {
    setState(prev => ({ value: prev?.value, pending: value, error: false }));

    try {
      const res = await fetch("/api/langfuse/user-thumbs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traceId,
          messageId,
          sessionId,
          userEmail,
          value,
          kind,
        }),
      });

      if (!res.ok) throw new Error("Feedback request failed");

      setState({ value, error: false });
    } catch {
      setState(prev => ({ value: prev?.value, error: true }));
    }
  }

  const pending = state?.pending;
  const selected = state?.value;

  return (
    <div className="flex min-h-6 items-center gap-[5px]">
      {([1, 0] as FeedbackValue[]).map((value) => {
        const isSelected = selected === value;
        const isPending = pending === value;
        const label = value === 1 ? "Good answer" : "Bad answer";

        const buttonClasses = [
          "flex h-6 w-6 items-center justify-center rounded-lg border transition-[border-color,background-color,color,opacity] duration-150",
          pending !== undefined ? "cursor-default" : "cursor-pointer",
          pending !== undefined && !isPending ? "opacity-55" : "opacity-100",
          isSelected
            ? "border-accent bg-accent/8 text-accent"
            : "border-pill bg-card text-text-light",
        ].join(" ");

        return (
          <button
            key={value}
            type="button"
            aria-label={label}
            title={label}
            onClick={() => submitFeedback(value)}
            disabled={pending !== undefined}
            className={buttonClasses}
          >
            <svg
              className={value === 0 ? "rotate-180" : undefined}
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M7 21h10.2a2 2 0 0 0 1.95-1.56l1.6-7A2 2 0 0 0 18.8 10H15V5.8A2.8 2.8 0 0 0 12.2 3L7 10v11Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        );
      })}
      {state?.error && (
        <span className="text-[10px] font-bold text-warning">
          Not saved
        </span>
      )}
    </div>
  );
}
