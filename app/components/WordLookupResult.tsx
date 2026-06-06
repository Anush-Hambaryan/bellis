"use client";

import { useState } from "react";
import { FlashcardDetails } from "./FlashcardDetails";
import type { Word } from "./FlashcardDetails";

function proficiencyLabel(word: Word) {
  const level = word.languageProficiency ?? "intermediate";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function WordLookupResult({
  word,
  onAdd,
  alreadyAdded,
}: {
  word: Word;
  onAdd: (options?: { replace?: boolean }) => void | Promise<void>;
  alreadyAdded: boolean;
}) {
  const [added, setAdded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [showReplacePrompt, setShowReplacePrompt] = useState(false);

  async function handleAdd() {
    if (added || saving) return;
    if (alreadyAdded) {
      setSaveError(false);
      setShowReplacePrompt(true);
      return;
    }

    setSaving(true);
    setSaveError(false);

    try {
      await onAdd();
      setAdded(true);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleReplace() {
    if (added || saving) return;
    setSaving(true);
    setSaveError(false);

    try {
      await onAdd({ replace: true });
      setAdded(true);
      setShowReplacePrompt(false);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  const isAdded = added;
  const level = proficiencyLabel(word);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-pill bg-card shadow-card">
      {/* Word header */}
      <div className="border-b border-pill px-4 pb-3 pt-3.5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="m-0 text-[19px] font-extrabold leading-none tracking-normal text-text-main">
            {word.word}
          </h4>
          <span className="shrink-0 rounded-full bg-accent-soft px-[9px] py-1 text-[10px] font-bold text-accent">
            {proficiencyLabel(word)}
          </span>
        </div>
      </div>

      {/* Hero image */}
      {word.heroImageUrl && (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={word.heroImageUrl}
            alt={word.word}
            className="block h-full w-full object-contain"
          />
        </div>
      )}

      <FlashcardDetails word={word} className="px-3.5 py-3" />

      {/* Add button */}
      <div className="border-t border-pill px-3.5 pb-3 pt-1.5">
        <button
          onClick={handleAdd}
          disabled={isAdded || saving}
          className={[
            "flex items-center gap-1.5 border-0 bg-transparent py-1 text-left transition-colors duration-200",
            isAdded || saving ? "cursor-default" : "cursor-pointer",
            isAdded ? "text-accent" : showReplacePrompt || saveError ? "text-danger" : "text-text-light",
          ].join(" ")}
        >
          {isAdded ? (
            <svg className="text-accent" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          )}
          <span className="text-[11px] font-medium">
            {isAdded ? "Saved to deck" : saving ? "Saving..." : saveError ? "Save failed" : "Save to deck"}
          </span>
        </button>
        {showReplacePrompt && !isAdded && (
          <div className="mt-2.5 rounded-[14px] border border-[rgba(160,58,58,0.24)] bg-danger-soft px-3 py-2.5">
            <p className="m-0 text-[11px] font-medium leading-[1.5] text-danger">
              A {level.toLowerCase()} flashcard for &quot;{word.word}&quot; is already in your deck.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowReplacePrompt(false)}
                disabled={saving}
                className="h-7 rounded-full border-0 bg-card px-3 text-[11px] font-bold text-text-mid enabled:cursor-pointer disabled:cursor-default disabled:opacity-55"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReplace}
                disabled={saving}
                className="h-7 rounded-full border-0 bg-danger px-3 text-[11px] font-extrabold text-white enabled:cursor-pointer disabled:cursor-default disabled:opacity-65"
              >
                {saving ? "Replacing..." : "Replace"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
