import type { Word } from "./FlashcardDetails";
import { BellisMark } from "./BellisMark";

function proficiencyLabel(word: Word) {
  const level = word.languageProficiency ?? "intermediate";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function FlashcardFront({
  word, onFlip, onDelete, deleteDisabled = false,
}: {
  word: Word; onFlip: () => void; onDelete?: () => void; deleteDisabled?: boolean;
}) {
  return (
    <div className="flashcard-face select-none px-3 pb-3 pt-3 sm:px-3.5 sm:pb-3.5 sm:pt-3.5">
      {onDelete && (
        <button
          type="button"
          aria-label="Delete flashcard"
          title="Delete flashcard"
          onClick={onDelete}
          disabled={deleteDisabled}
          className="absolute top-6 right-6 z-[5] flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-page/85 text-text-mid backdrop-blur-sm opacity-100 transition-[background-color,color,opacity,transform] duration-150 enabled:cursor-pointer enabled:hover:bg-card enabled:hover:text-text-main disabled:cursor-default disabled:opacity-55"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
          </svg>
        </button>
      )}

      {/* Hero image */}
      <div className="flex h-[48%] min-h-[170px] max-h-[340px] w-full shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-content sm:h-[50%] sm:min-h-[190px] sm:rounded-[22px] lg:h-[52%] max-[700px]:h-[42%] max-[700px]:min-h-[140px] max-[700px]:max-h-[240px]">
        {word.heroImageUrl ? (
          <img
            src={word.heroImageUrl}
            alt={word.word}
            className="block h-full w-full object-cover"
          />
        ) : (
          <>
            <svg className="text-text-light" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-[10px] tracking-[0.08em] text-text-light">Image</span>
          </>
        )}
      </div>

      {/* Word */}
      <div className="mt-5 flex min-w-0 flex-col gap-1.5 pb-1 sm:mt-5 sm:gap-2 sm:pb-1.5 max-[700px]:mt-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <BellisMark size={34} className="translate-y-1 shrink-0 max-[700px]:h-7 max-[700px]:w-7" />
          <h2 className="m-0 min-w-0 break-words text-[clamp(1.8rem,9vw,2.5rem)] font-extrabold leading-none tracking-normal text-text-main sm:text-[clamp(2.5rem,4vw,4rem)] max-[700px]:text-[clamp(1.6rem,8vw,2.15rem)]">
            {word.word}
          </h2>
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-auto flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-content px-[9px] py-1 text-[10px] text-text-light sm:px-[11px] sm:text-[11px]">
            {word.definitions.length} definition{word.definitions.length > 1 ? "s" : ""}
          </span>
          <span className="rounded-full bg-accent-soft px-[9px] py-1 text-[10px] font-bold text-accent sm:px-[11px] sm:text-[11px]">
            {proficiencyLabel(word)}
          </span>
        </div>
        <button
          onClick={onFlip}
          className="flashcard-action group shrink-0 px-3 py-1.5 sm:px-4 sm:py-2"
        >
          <span className="flashcard-action-label">
            flip card
          </span>
          <span className="inline-block text-xs text-accent transition-transform duration-200 group-hover:translate-x-[3px]">→</span>
        </button>
      </div>
    </div>
  );
}
