import { FlashcardDetails } from "./FlashcardDetails";
import { BellisMark } from "./BellisMark";
import type { Word } from "./FlashcardDetails";

export function FlashcardBack({ word, onFlip }: { word: Word; onFlip: () => void }) {
  return (
    <div className="flashcard-face [transform:rotateY(180deg)]">
      <div className="shrink-0 px-3.5 pb-3 pt-5">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2.5">
            <BellisMark size={24} />
            <h3 className="m-0 min-w-0 text-2xl font-extrabold leading-none tracking-normal text-text-main">
              {word.word}
            </h3>
          </div>
        </div>
      </div>
      <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto px-3.5 pt-1">
        <FlashcardDetails word={word} />
      </div>
      <div className="flex shrink-0 justify-end p-3.5">
        <button
          onClick={onFlip}
          className="flashcard-action group"
        >
          <span className="inline-block text-xs text-accent transition-transform duration-200 group-hover:-translate-x-[3px]">←</span>
          <span className="flashcard-action-label">
            flip back
          </span>
        </button>
      </div>
    </div>
  );
}
