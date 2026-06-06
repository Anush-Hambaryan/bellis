export type ProgressStep = "dictionary_lookup" | "fetch_past_terms" | "image_search" | "image_ranker" | "flashcard_writer";
export type ProgressStatus = "running" | "started" | "completed" | "failed" | "interrupted";
export type ProgressStatuses = Partial<Record<ProgressStep, ProgressStatus>>;

const WORD_LOOKUP_PROGRESS_STEPS: { step: ProgressStep; label: string }[] = [
  { step: "dictionary_lookup", label: "Consulting a dictionary"},
  { step: "fetch_past_terms", label: "Checking past searches"},
  { step: "image_search", label: "Finding image options" },
  { step: "image_ranker", label: "Choosing the best image" },
  { step: "flashcard_writer", label: "Writing the flashcard" },
];

export function WordLookupProgress({ progress = {} }: { progress?: ProgressStatuses }) {

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="w-full rounded-2xl border border-pill bg-card px-4 py-3.5 shadow-card"
    >
      <p className="mb-3 mt-0 text-[11px] font-extrabold uppercase tracking-[0.08em] text-accent">
        Making your flashcard
      </p>
      <div className="flex flex-col gap-2.5">
        {WORD_LOOKUP_PROGRESS_STEPS.map(({ step, label }) => {
          const status = progress[step] ?? "pending";
          const isActive = status === "started" || status === "running";
          const isComplete = status === "completed";

          const dotClasses = [
            "h-2.5 w-2.5 shrink-0 rounded-full border-2",
            isActive ? "animate-dot-bounce" : "",
            isComplete ? "border-accent bg-accent" : "",
            isActive && !isComplete ? "border-accent bg-accent" : "",
            !isActive && !isComplete ? "border-pill bg-transparent" : "",
          ].filter(Boolean).join(" ");

          const labelClasses = [
            "text-xs font-semibold leading-[1.4]",
            isActive ? "font-bold text-text-main" : "text-text-mid",
          ].join(" ");

          return (
            <div key={step} className="flex min-h-[22px] items-center gap-2.5">
              <span className={dotClasses} />
              <span className={labelClasses}>{label}</span>
              {isComplete && (
                <span className="ml-auto text-[10px] font-bold text-accent">
                  Done
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
