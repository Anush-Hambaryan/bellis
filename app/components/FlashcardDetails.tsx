import { DictionaryData } from "./DictionaryData";
import { RichText } from "./RichText";
import type { DictMeaning, ParsedDictEntry } from "./DictionaryData";
import type { LanguageProficiency } from "./LanguageProficiencySelect";
import type { ReactNode } from "react";

export type Word = {
  word: string;
  phonetic: string;
  pos: string;
  tag: string;
  languageProficiency: LanguageProficiency;
  definitions: { text: string; example: string; hint: string }[];
  fact: string;
  heroImageUrl?: string | null;
  dictMeanings?: DictMeaning[];
  dictEntries?: ParsedDictEntry[];
  knowledgeLink?: string;
};

function LightbulbIcon() {
  return (
    <svg className="shrink-0 text-accent" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2.8a6.1 6.1 0 0 1 3.2 11.3c-.8.5-1.2 1.2-1.2 2.1h-4c0-.9-.4-1.6-1.2-2.1A6.1 6.1 0 0 1 12 2.8Z" />
      <path d="M4 10H2.5" />
      <path d="M21.5 10H20" />
      <path d="m5.6 3.8 1.1 1.1" />
      <path d="m17.3 4.9 1.1-1.1" />
    </svg>
  );
}

function ExampleIcon() {
  return (
    <svg className="shrink-0 text-accent" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9.4 5.6c-2.7 1.7-4.2 4-4.2 6.9 0 2.3 1.2 3.9 3.1 3.9 1.5 0 2.6-1.1 2.6-2.6 0-1.4-1-2.4-2.4-2.5.2-1.5 1-2.7 2.5-3.8L9.4 5.6Z"
        fill="currentColor"
      />
      <path
        d="M17.2 5.6c-2.7 1.7-4.2 4-4.2 6.9 0 2.3 1.2 3.9 3.1 3.9 1.5 0 2.6-1.1 2.6-2.6 0-1.4-1-2.4-2.4-2.5.2-1.5 1-2.7 2.5-3.8l-1.6-1.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.8 13.7a4 4 0 0 0 5.7.1l2.4-2.4a4 4 0 0 0-5.7-5.7l-1.1 1.1" />
      <path d="M14.2 10.3a4 4 0 0 0-5.7-.1l-2.4 2.4a4 4 0 0 0 5.7 5.7l1.1-1.1" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 5.2A2.2 2.2 0 0 1 6.7 3H20v16H7a2.5 2.5 0 0 0-2.5 2.5V5.2Z" />
      <path d="M4.5 19.4A2.5 2.5 0 0 1 7 17h13" />
      <path d="M8.2 7.5h7.6" />
      <path d="M8.2 10.5h5.8" />
    </svg>
  );
}

function InfoIconShell({
  children,
  tone = "green",
}: {
  children: ReactNode;
  tone?: "green" | "blue" | "warm";
}) {
  return (
    <div className={[
      "flex h-8 w-8 shrink-0 items-center justify-center",
      tone === "warm" && "text-[#7B4A32]",
      tone === "blue" && "text-[#526B92]",
      tone === "green" && "text-accent",
    ].join(" ")}>
      {children}
    </div>
  );
}

export function FlashcardDetails({
  word,
  className = "",
  dictionaryClassName = "m-0 shrink-0",
}: {
  word: Word;
  className?: string;
  dictionaryClassName?: string;
}) {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="border-y border-pill">
        {word.definitions.map((def, index) => (
          <div
            key={index}
            className={[
              "py-4 min-[680px]:py-5",
              index > 0 ? "border-t border-pill" : "",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <div className="flex w-8 shrink-0 justify-center">
                <span className="flex h-[24px] w-8 shrink-0 items-center justify-center text-lg font-extrabold leading-none text-accent">
                  -
                </span>
              </div>
              <p className="m-0 min-w-0 text-[15px] font-semibold leading-[1.58] text-text-main">
                {def.text.replace(/\*\*([^*]+)\*\*/g, "$1")}
              </p>
            </div>

            <div className="mt-3 grid gap-3 min-[680px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[680px]:gap-0">
              <div className="pl-11 min-[680px]:pr-7">
                <div className="mb-2 flex items-center gap-2.5">
                  <ExampleIcon />
                  <p className="m-0 text-sm font-extrabold leading-none text-accent">Example</p>
                </div>
                <RichText
                  text={def.example}
                  boldClassName="text-accent"
                  className="text-[13px] font-medium leading-[1.62] text-text-mid"
                />
              </div>

              <div className="border-t border-pill pt-3 min-[680px]:border-l min-[680px]:border-t-0 min-[680px]:border-pill min-[680px]:pl-7 min-[680px]:pt-0">
                <div className="mb-2 flex items-center gap-2.5">
                  <LightbulbIcon />
                  <p className="m-0 text-sm font-extrabold leading-none text-accent">Memory tip</p>
                </div>
                <RichText
                  text={def.hint}
                  boldClassName="text-accent"
                  className="text-[13px] font-medium leading-[1.62] text-text-mid"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {(word.knowledgeLink || word.fact) && (
        <div className="grid gap-3 min-[680px]:grid-cols-2">
          {word.knowledgeLink && (
            <div className="min-w-0 rounded-[14px] border border-[#E3E7F0] bg-[#F8FAFE] px-3.5 py-3.5">
              <div className="mb-2 flex items-center gap-2.5">
                <InfoIconShell tone="blue">
                  <LinkIcon />
                </InfoIconShell>
                <p className="m-0 text-sm font-extrabold leading-none text-[#526B92]">
                  Connected to your searches
                </p>
              </div>
              <p className="m-0 text-[13px] font-medium leading-[1.55] text-text-mid">
                {word.knowledgeLink}
              </p>
            </div>
          )}

          {word.fact && (
            <div className="min-w-0 rounded-[14px] border border-[#E7DDD4] bg-[#FBF8F4] px-3.5 py-3.5">
              <div className="mb-2 flex items-center gap-2.5">
                <InfoIconShell tone="warm">
                  <BookIcon />
                </InfoIconShell>
                <p className="m-0 text-sm font-extrabold leading-none text-[#7B4A32]">
                  Good to know
                </p>
              </div>
              <RichText
                text={word.fact}
                boldClassName="text-[#7B4A32]"
                className="text-[13px] font-medium leading-[1.55] text-text-mid"
              />
            </div>
          )}
        </div>
      )}

      <DictionaryData word={word} className={dictionaryClassName} />
    </div>
  );
}
