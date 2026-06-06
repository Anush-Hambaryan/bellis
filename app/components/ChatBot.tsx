"use client";

import { useState, useRef, useEffect } from "react";
import { WordLookupResult } from "./WordLookupResult";
import { MarkdownBlock } from "./Markdown";
import { LanguageProficiencySelect, getStoredLanguageProficiency } from "./LanguageProficiencySelect";
import { UserFeedback } from "./UserFeedback";
import {
  WordLookupProgress,
  type ProgressStatus,
  type ProgressStatuses,
  type ProgressStep,
} from "./WordLookupProgress";
import type { ParsedDictEntry } from "./DictionaryData";
import type { Word } from "./FlashcardDetails";
import type { LanguageProficiency } from "./LanguageProficiencySelect";
import type { ChatHistoryMessage, FlashcardData, InputKind } from "@/app/lib/graph";

type ParsedFlashcard = Partial<Omit<FlashcardData, "senses">> & {
  heroImageUrl?: string | null;
  senses?: Array<Partial<FlashcardData["senses"][number]> & {
    partOfSpeech?: string;
  }>;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function parsedToWord(
  fc: ParsedFlashcard,
  languageProficiency: LanguageProficiency,
  dictEntry?: ParsedDictEntry[],
  heroImageUrl?: string | null,
): Word {
  const firstEntry = dictEntry?.[0];
  const firstPhoneticText = firstEntry?.phonetics?.find((p) => p.text)?.text;

  return {
    word:         fc.word ?? "",
    phonetic:     firstEntry?.phonetic ?? firstPhoneticText ?? "",
    pos:          fc.senses?.[0]?.partOfSpeech ?? "",
    tag:          fc.senses?.[0]?.partOfSpeech ?? "",
    languageProficiency,
    heroImageUrl: heroImageUrl ?? fc.heroImageUrl,
    definitions:  (fc.senses ?? []).map(s => ({
      text:    s.definition     ?? "",
      example: s.exampleSentence ?? "",
      hint:    s.memoryHint     ?? "",
    })),
    fact:         fc.didYouKnow ?? "",
    knowledgeLink:fc.linkToKnowledgeBase || undefined,
    dictMeanings: (dictEntry ?? []).flatMap(entry => entry.meanings ?? []).map(m => ({
      partOfSpeech: m.partOfSpeech,
      definitions:  m.definitions.map(d => ({ definition: d.definition, example: d.example, synonyms: d.synonyms, antonyms: d.antonyms })),
      synonyms: m.synonyms,
      antonyms: m.antonyms,
    })),
    dictEntries: dictEntry,
  };
}

type AssistantContent =
  | { status: "loading"; kind?: InputKind; progress?: ProgressStatuses }
  | { status: "text"; text: string }
  | { status: "markdown"; markdown: string }
  | { status: "flashcard"; word: Word; formNote?: string | null }
  | { status: "interrupt"; spellingOptions: string[] }
  | { status: "error" };

type Msg =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; content: AssistantContent; traceId?: string };

type ChatEvent =
  | { type: "kind"; kind: InputKind }
  | { type: "progress"; step: ProgressStep; status: ProgressStatus }
  | { type: "trace"; traceId: string }
  | { type: "markdownDelta"; delta: string }
  | { type: "text"; text: string }
  | { type: "flashcard"; flashcard: ParsedFlashcard; dictEntry?: ParsedDictEntry[]; formNote?: string | null }
  | { type: "interrupt"; spellingOptions?: string[] }
  | { type: "error" }

const INIT: Msg = {
  id: "init",
  role: "assistant",
  content: {
    status: "text",
    text: "Send a single English word or explicitly ask for its definition or meaning if you'd like me to create a flashcard with meanings, examples, memory tips, and useful facts. Ask a full grammar, usage, or word-choice question when you want an explanation instead. I can also suggest corrections for misspelled words. When I create a flashcard, click 'Save to deck' to save it.",
  },
};

const EXAMPLE_PROMPTS = [
  { label: "Define artifat", text: "Define artifat" },
  { label: "helix", text: "helix" },
  { label: "Affect vs effect", text: "Affect vs effect" },
  { label: "What is the difference between fewer and less?", text: "What is the difference between fewer and less?" },
  { label: "How do I pronounce thorough?", text: "How do I pronounce thorough?" },
  { label: "Why do we say \"I've been learning English\" instead of \"I learn English\"?", text: "Why do we say \"I've been learning English\" instead of \"I learn English\"?" },
] as const;

function assistantContentToText(content: AssistantContent) {
  if (content.status === "text") return content.text;
  if (content.status === "markdown") return content.markdown;
  if (content.status === "flashcard") {
    const definitions = content.word.definitions
      .map((d) => `- ${d.text}${d.example ? ` Example: ${d.example}` : ""}`)
      .join("\n");

    return [
      content.formNote,
      `Vocabulary card for "${content.word.word}"${content.word.pos ? ` (${content.word.pos})` : ""}.`,
      definitions,
      content.word.fact ? `Did you know: ${content.word.fact}` : null,
    ].filter(Boolean).join("\n");
  }
  if (content.status === "interrupt") {
    return `Asked the user to choose a spelling suggestion: ${content.spellingOptions.join(", ")}`;
  }
  return "";
}

function normalizeWordKey(word: string) {
  return word.trim().toLowerCase();
}

function wordLevel(word: Pick<Word, "languageProficiency">) {
  return word.languageProficiency ?? "intermediate";
}

function toPreviousMessages(messages: Msg[]): ChatHistoryMessage[] {
  return messages
    .filter((msg) => msg.id !== INIT.id)
    .map((msg) => {
      if (msg.role === "user") return { role: "user" as const, content: msg.text };
      return { role: "assistant" as const, content: assistantContentToText(msg.content) };
    })
    .filter((msg) => msg.content.trim().length > 0)
    .slice(-12);
}

function TypingDots() {
  const dotDelays = ["[animation-delay:0ms]", "[animation-delay:160ms]", "[animation-delay:320ms]"];

  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-[5px] rounded-[14px_14px_14px_3px] bg-content px-3.5 py-2.5">
        {dotDelays.map((delayClass) => (
          <span
            key={delayClass}
            className={cx("block h-[5px] w-[5px] animate-dot-bounce rounded-full bg-text-light", delayClass)}
          />
        ))}
      </div>
    </div>
  );
}

function assistantContentKind(content: AssistantContent) {
  if (content.status === "text" || content.status === "markdown" || content.status === "flashcard") {
    return content.status;
  }
  return null;
}

function AssistantFeedback({
  message,
  sessionId,
  userEmail,
}: {
  message: Extract<Msg, { role: "assistant" }>;
  sessionId: string;
  userEmail?: string;
}) {
  const kind = assistantContentKind(message.content);
  if (!message.traceId || !kind) return null;

  return (
    <UserFeedback
      messageId={message.id}
      traceId={message.traceId}
      sessionId={sessionId}
      userEmail={userEmail}
      kind={kind}
    />
  );
}

export function ChatBot({
  onAddWord,
  deckWords,
  userEmail,
}: {
  onAddWord: (w: Word, options?: { replace?: boolean }) => void | Promise<void>;
  deckWords: Word[];
  userEmail?: string;
}) {
  const [input, setInput]           = useState("");
  const [threadId]                  = useState(() => crypto.randomUUID());
  const [languageProficiency, setLanguageProficiency] = useState<LanguageProficiency>(getStoredLanguageProficiency);
  const [msgs, setMsgs]             = useState<Msg[]>([INIT]);
  const [busy, setBusy]             = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const lastUserRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = messagesRef.current;
    const el = lastUserRef.current;
    if (!container || !el) return;
    container.scrollTop = container.scrollTop + el.getBoundingClientRect().top - container.getBoundingClientRect().top;
  }, [msgs]);

  function updateAssistant(id: string, content: AssistantContent) {
    setMsgs(prev => prev.map(m => m.id === id && m.role === "assistant" ? { ...m, content } : m));
  }

  function updateAssistantWith(id: string, getContent: (content: AssistantContent) => AssistantContent) {
    setMsgs(prev => prev.map(m => m.id === id && m.role === "assistant" ? { ...m, content: getContent(m.content) } : m));
  }

  function updateAssistantTrace(id: string, traceId: string) {
    setMsgs(prev => prev.map(m => m.id === id && m.role === "assistant" ? { ...m, traceId } : m));
  }

  async function doStream(body: { userInput?: string; resume?: string | null }, targetId?: string, previousMessages = toPreviousMessages(msgs)) {
    const asstId = targetId ?? crypto.randomUUID();
    let markdown = "";
    const loading: AssistantContent = body.resume !== undefined
      ? { status: "loading", kind: "word_lookup", progress: { dictionary_lookup: "started" } }
      : { status: "loading" };

    setMsgs(prev => targetId
      ? prev.map(m => m.id === asstId && m.role === "assistant" ? { ...m, content: loading } : m)
      : [...prev, { id: asstId, role: "assistant", content: loading }]
    );
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          previousMessages,
          languageProficiency,
          userEmail,
          ...body,
        }),
      });
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += dec.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";

        for (const raw of events) {
          if (!raw.startsWith("data: ")) continue;
          const event = JSON.parse(raw.slice(6)) as ChatEvent;

          if (event.type === "kind") {
            updateAssistantWith(asstId, (content) => content.status === "loading"
              ? { ...content, kind: event.kind }
              : content
            );
          } else if (event.type === "progress") {
            updateAssistantWith(asstId, (content) => content.status === "loading"
              ? {
                  ...content,
                  kind: content.kind ?? "word_lookup",
                  progress: {
                    ...content.progress,
                    [event.step]: event.status,
                  },
                }
              : content
            );
          } else if (event.type === "markdownDelta") {
            markdown += event.delta;
            updateAssistant(asstId, { status: "markdown", markdown });
          } else if (event.type === "text") {
            updateAssistant(asstId, { status: "text", text: event.text });
          } else if (event.type === "flashcard") {
            const word = parsedToWord(event.flashcard, languageProficiency, event.dictEntry, event.flashcard.heroImageUrl);
            updateAssistant(asstId, { status: "flashcard", word, formNote: event.formNote });
          } else if (event.type === "trace") {
            updateAssistantTrace(asstId, event.traceId);
          } else if (event.type === "interrupt") {
            updateAssistant(asstId, { status: "interrupt", spellingOptions: event.spellingOptions ?? [] });
          } else if (event.type === "error") {
            updateAssistant(asstId, { status: "error" });
          }
        }
      }
    } finally {
      setBusy(false);
    }
  }

  function sendText(value: string) {
    const text = value.trim();
    if (!text || busy) return;
    const previousMessages = toPreviousMessages(msgs);
    setMsgs(prev => [...prev, { id: crypto.randomUUID(), role: "user", text }]);
    doStream({ userInput: text }, undefined, previousMessages);
    setInput("");
  }

  function send() {
    sendText(input);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function selectSpelling(word: string | null, msgId: string) {
    if (word === null) {
      updateAssistant(msgId, { status: "text", text: "No problem — try another word." });
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          previousMessages: toPreviousMessages(msgs),
          userEmail,
          resume: null,
        }),
      }).catch(() => {});
      return;
    }
    doStream({ resume: word }, msgId, toPreviousMessages(msgs));
  }

  const lastUserMsgId = [...msgs].reverse().find(m => m.role === "user")?.id ?? null;
  const hasStartedConversation = msgs.some((msg) => msg.role === "user");

  return (
    <div className="flex h-[min(620px,calc(100vh-180px))] min-h-[460px] min-w-0 shrink-0 flex-col overflow-hidden rounded-3xl bg-card shadow-card-lg md:h-auto md:min-h-0 md:flex-1">
      <div className="shrink-0 border-b border-black/6 py-2.5 pl-3.5 pr-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-light">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="7" width="14" height="12" rx="3" />
                <path d="M12 7V3" />
                <circle cx="12" cy="3" r="1" fill="currentColor" stroke="none" />
                <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
                <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
                <path d="M10 16h4" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="m-0 text-[13px] font-bold text-text-main">Word Lookup</p>
            </div>
          </div>
          <LanguageProficiencySelect
            value={languageProficiency}
            onChange={setLanguageProficiency}
            disabled={busy}
          />
        </div>
      </div>

      <div
        ref={messagesRef}
        className="no-scrollbar flex flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 pb-1.5 pt-3.5"
      >
        {msgs.map((msg) => {
          if (msg.role === "user") {
            return (
              <div
                key={msg.id}
                ref={msg.id === lastUserMsgId ? lastUserRef : null}
                className="flex animate-msg-in justify-end"
              >
                <div className="max-w-[82%] rounded-[14px_14px_3px_14px] bg-overlay px-[13px] py-2 shadow-[0_3px_10px_rgba(84,109,90,0.2)]">
                  <p className="m-0 text-xs leading-normal text-white">{msg.text}</p>
                </div>
              </div>
            );
          }

          const content = msg.content;

          if (content.status === "loading") {
            return content.kind === "word_lookup" ? (
              <div key={msg.id} className="flex w-full animate-msg-in justify-start">
                <WordLookupProgress progress={content.progress} />
              </div>
            ) : <div key={msg.id} className="animate-msg-in"><TypingDots /></div>;
          }

          if (content.status === "interrupt") {
            return (
              <div key={msg.id} className="flex animate-msg-in justify-start">
                <div className="flex max-w-[90%] flex-col gap-2.5 rounded-[14px_14px_14px_3px] bg-content px-3.5 py-3">
                  <p className="m-0 text-xs leading-normal text-text-mid">
                    Word not found. Did you mean one of these?
                  </p>
                  <div className="flex flex-wrap gap-[7px]">
                    {content.spellingOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => selectSpelling(opt, msg.id)}
                        disabled={busy}
                        className="rounded-full border-[1.5px] border-accent bg-card px-[13px] py-[5px] text-xs font-semibold text-accent transition-colors disabled:cursor-default enabled:cursor-pointer enabled:hover:bg-accent-soft"
                      >
                        {opt}
                      </button>
                    ))}
                    <button
                      onClick={() => selectSpelling(null, msg.id)}
                      disabled={busy}
                      className="rounded-full border-[1.5px] border-pill bg-transparent px-[13px] py-[5px] text-xs font-medium text-text-light disabled:cursor-default enabled:cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          if (content.status === "flashcard") {
            const alreadyAdded = deckWords.some((w) =>
              normalizeWordKey(w.word) === normalizeWordKey(content.word.word) &&
              wordLevel(w) === wordLevel(content.word)
            );
            return (
              <div key={msg.id} className="flex w-full animate-msg-in flex-col justify-start gap-1.5">
                {content.formNote && (
                  <div className="max-w-[90%] rounded-[14px_14px_14px_3px] bg-content px-[13px] py-2">
                    <p className="m-0 text-[11px] italic leading-normal text-text-mid">
                      {content.formNote}
                    </p>
                  </div>
                )}
                <WordLookupResult
                  word={content.word}
                  onAdd={(options) => onAddWord(content.word, options)}
                  alreadyAdded={alreadyAdded}
                />
                <AssistantFeedback message={msg} sessionId={threadId} userEmail={userEmail} />
              </div>
            );
          }

          if (content.status === "markdown") {
            return (
              <div key={msg.id} className="flex animate-msg-in flex-col items-start justify-start gap-1.5">
                <div className="max-w-[92%] rounded-[14px_14px_14px_3px] bg-content px-3.5 py-3">
                  <MarkdownBlock text={content.markdown} />
                </div>
                <AssistantFeedback message={msg} sessionId={threadId} userEmail={userEmail} />
              </div>
            );
          }

          if (content.status === "text") {
            return (
              <div key={msg.id} className="flex animate-msg-in flex-col items-start justify-start gap-1.5">
                <div className="max-w-[90%] rounded-[14px_14px_14px_3px] bg-content px-[13px] py-[9px]">
                  <p className="m-0 text-xs leading-[1.6] text-text-mid">{content.text}</p>
                </div>
                <AssistantFeedback message={msg} sessionId={threadId} userEmail={userEmail} />
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex animate-msg-in justify-start">
              <div className="max-w-[90%] rounded-[14px_14px_14px_3px] bg-content px-[13px] py-[9px]">
                <p className="m-0 text-xs leading-[1.6] text-text-mid">Something went wrong. Try again.</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 border-t border-black/6 p-3.5">
        {!hasStartedConversation && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => sendText(example.text)}
                disabled={busy}
                className="max-w-full rounded-full border border-pill bg-card px-2.5 py-1 text-left text-[11px] font-semibold leading-snug whitespace-normal text-text-mid transition-colors enabled:cursor-pointer enabled:hover:border-accent enabled:hover:bg-accent-soft enabled:hover:text-accent disabled:cursor-default disabled:opacity-50"
              >
                {example.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex h-11 items-center gap-2 rounded-xl border-[1.5px] border-black/8 bg-content py-0 pl-3.5 pr-2 transition-[border-color,background-color] duration-[180ms] focus-within:border-accent/70 focus-within:bg-card">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask about a word, phrase, grammar, or usage..."
            className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-text-main outline-none placeholder:text-placeholder"
          />
          <button
            onClick={send}
            disabled={busy}
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] border-0 bg-text-main text-white shadow-button transition-all duration-[140ms] active:scale-[0.9] disabled:cursor-default disabled:bg-content disabled:opacity-50 disabled:shadow-none enabled:cursor-pointer"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
