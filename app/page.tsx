"use client";

import { useState, useEffect } from "react";
import { FlashcardFront } from "./components/FlashcardFront";
import { FlashcardBack } from "./components/FlashcardBack";
import { ChatBot } from "./components/ChatBot";
import { useUser } from "@clerk/nextjs";
import type { Word } from "./components/FlashcardDetails";

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LearningSpace() {
  const { user, isLoaded } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  const [words, setWords]     = useState<Word[]>([]);
  const [idx, setIdx]         = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [slideDir,   setSlideDir]   = useState<"next" | "prev">("next");
  const [slidePhase, setSlidePhase] = useState<"idle" | "exiting" | "pre-enter">("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Word | null>(null);
  const [loadedFlashcardsForEmail, setLoadedFlashcardsForEmail] = useState<string | null>(null);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredWords = normalizedSearchQuery
    ? words.filter((w) => w.word.toLowerCase().includes(normalizedSearchQuery))
    : words;
  const word  = filteredWords[idx];
  const total = filteredWords.length;
  const loadingFlashcards = !!userEmail && loadedFlashcardsForEmail !== userEmail;

  function flashcardKeyMatches(a: Word, b: Word) {
    return (
      a.word.toLowerCase() === b.word.toLowerCase() &&
      (a.languageProficiency ?? "intermediate") === (b.languageProficiency ?? "intermediate")
    );
  }

  useEffect(() => {
    if (!isLoaded) return;
    if (!userEmail) return;

    let cancelled = false;

    async function loadFlashcards() {
      const res = await fetch("/api/flashcards");
      if (!res.ok) throw new Error("Failed to load flashcards");
      const data = (await res.json()) as { flashcards?: Word[] };
      if (cancelled) return;

      const savedWords = data.flashcards ?? [];
      setWords(savedWords);
      setIdx(0);
      setFlipped(false);
    }

    loadFlashcards().catch(() => {
      if (!cancelled) setWords([]);
    }).finally(() => {
      if (!cancelled) setLoadedFlashcardsForEmail(userEmail);
    });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userEmail]);

  function goTo(next: number) {
    if (next === idx || next < 0 || next >= total || slidePhase !== "idle") return;
    setSlideDir(next > idx ? "next" : "prev");
    setSlidePhase("exiting");
    setTimeout(() => {
      setIdx(next);
      setFlipped(false);
      setSlidePhase("pre-enter");
      requestAnimationFrame(() => setSlidePhase("idle"));
    }, 200);
  }

  async function addWord(newWord: Word, options?: { replace?: boolean }) {
    if (userEmail) {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcard: newWord, replace: options?.replace === true }),
      });

      if (!res.ok) throw new Error("Failed to save flashcard");
    }

    setSearchQuery("");
    setWords((prev) => {
      const hasExisting = prev.some((w) => flashcardKeyMatches(w, newWord));
      if (!hasExisting) return [newWord, ...prev];
      if (!options?.replace) return prev;
      return [newWord, ...prev.filter((w) => !flashcardKeyMatches(w, newWord))];
    });
    setIdx(0);
    setFlipped(false);
  }

  async function deleteWord(target: Word) {
    if (deleting) return;

    const level = target.languageProficiency ?? "intermediate";
    setDeleting(true);
    try {
      if (userEmail) {
        const res = await fetch("/api/flashcards", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word: target.word,
            languageProficiency: level,
          }),
        });

        if (!res.ok) throw new Error("Failed to delete flashcard");
      }

      setWords((prev) => {
        return prev.filter((w) =>
          w.word.toLowerCase() !== target.word.toLowerCase() ||
          (w.languageProficiency ?? "intermediate") !== level
        );
      });
      setIdx((currentIdx) => Math.min(currentIdx, Math.max(total - 2, 0)));
      setFlipped(false);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const cardSlideClass =
    slidePhase === "idle"
      ? "translate-x-0 opacity-100 transition-[opacity,transform] duration-200 ease-in-out"
      : slidePhase === "exiting"
        ? `${slideDir === "next" ? "-translate-x-16" : "translate-x-16"} opacity-0 transition-[opacity,transform] duration-200 ease-in-out`
        : `${slideDir === "next" ? "translate-x-16" : "-translate-x-16"} opacity-0 transition-none`;
  const flipClass = flipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]";

  return (
    <>
      <div className="relative flex min-h-full flex-col overflow-visible px-4 pt-2 pb-4 font-sans md:h-full md:overflow-hidden md:px-8 md:pt-[18px] md:pb-3">

        {/* Main layout: chatbot left, flashcard section right */}
        <div className="relative flex min-h-0 flex-1 flex-col items-stretch gap-5 md:flex-row md:gap-7">

          {/* Chatbot */}
          <ChatBot onAddWord={addWord} deckWords={words} userEmail={userEmail} />

          {/* Flashcard column */}
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="grid shrink-0 grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto] md:flex md:items-center">
              <div className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-pill bg-card px-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.05)]">
                <svg className="shrink-0 stroke-text-light" width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="search"
                  aria-label="Search flashcards by word"
                  placeholder="Search flashcards"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIdx(0);
                    setFlipped(false);
                  }}
                  className="min-w-0 flex-1 border-0 bg-transparent text-[13px] font-semibold text-text-main outline-none placeholder:text-placeholder"
                />
              </div>
              <div className="flex h-11 shrink-0 items-center justify-between gap-2 rounded-full border border-pill bg-card px-2 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.05)] sm:justify-center">
                <button
                  onClick={() => goTo(idx - 1)}
                  disabled={idx === 0 || slidePhase !== "idle"}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent text-sm text-text-mid transition-all duration-150 ease-in-out enabled:cursor-pointer enabled:active:scale-[0.88] enabled:active:text-accent disabled:cursor-default disabled:text-text-light/50 disabled:opacity-40"
                >
                  ←
                </button>
                <span className="min-w-7 text-center text-[11px] font-bold tracking-[0.04em] text-text-mid">
                  {loadingFlashcards ? "..." : total > 0 ? `${idx + 1}/${total}` : `0/${words.length}`}
                </span>
                <button
                  onClick={() => goTo(idx + 1)}
                  disabled={idx >= total - 1 || slidePhase !== "idle"}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent text-sm text-text-mid transition-all duration-150 ease-in-out enabled:cursor-pointer enabled:active:scale-[0.88] enabled:active:text-accent disabled:cursor-default disabled:text-text-light/50 disabled:opacity-40"
                >
                  →
                </button>
              </div>
            </div>
            <div className="relative h-[min(620px,calc(100vh-190px))] min-h-[460px] w-full md:h-full md:min-h-0">
              {loadingFlashcards ? (
                <div className="flex h-full w-full items-center justify-center rounded-[28px] bg-card p-8 text-center shadow-card-lg">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent-soft border-t-accent" />
                    <p className="m-0 text-[13px] font-extrabold text-text-main">
                      Loading flashcards
                    </p>
                  </div>
                </div>
              ) : word ? (
                <div
                  className={`relative h-full w-full rounded-[28px] shadow-card-lg ${cardSlideClass}`}
                >
                  <div
                    className={`relative h-full w-full transition-transform duration-[650ms] ease-[cubic-bezier(0.4,0,0.2,1)] [transform-style:preserve-3d] ${flipClass}`}
                  >
                    <FlashcardFront
                      word={word}
                      onFlip={() => setFlipped(true)}
                      onDelete={() => setDeleteTarget(word)}
                      deleteDisabled={deleting || slidePhase !== "idle"}
                    />
                    <FlashcardBack word={word} onFlip={() => setFlipped(false)} />
                  </div>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-[28px] bg-card p-8 text-center shadow-card-lg">
                  <div className="max-w-80">
                    <p className="mb-2 text-[13px] font-extrabold text-text-main">
                      {words.length === 0 ? "No flashcards saved yet" : "No matching flashcards"}
                    </p>
                    <p className="m-0 text-xs leading-[1.6] text-text-mid">
                      {words.length === 0
                        ? "Search for a word, then save it as a flashcard to add it to your deck."
                        : "Try a different word or clear the search field."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {deleteTarget && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) setDeleteTarget(null);
          }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-text-main/18 p-6"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-flashcard-title"
            className="w-[min(360px,100%)] rounded-[18px] border border-pill bg-card p-5 shadow-[0_20px_70px_rgba(0,0,0,0.18),0_6px_20px_rgba(0,0,0,0.10)]"
          >
            <h2
              id="delete-flashcard-title"
              className="mb-2 text-base font-extrabold tracking-[-0.01em] text-text-main"
            >
              Delete flashcard?
            </h2>
            <p className="mb-[18px] text-[13px] leading-[1.55] text-text-mid">
              Remove “{deleteTarget.word}” ({deleteTarget.languageProficiency ?? "intermediate"}) from your deck.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="h-9 rounded-full border-0 bg-content px-3.5 text-xs font-bold text-text-mid enabled:cursor-pointer disabled:cursor-default disabled:opacity-55"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void deleteWord(deleteTarget);
                }}
                disabled={deleting}
                className="h-9 rounded-full border border-[rgba(160,58,58,0.24)] bg-danger-soft px-[15px] text-xs font-extrabold text-danger enabled:cursor-pointer disabled:cursor-default disabled:opacity-65"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
