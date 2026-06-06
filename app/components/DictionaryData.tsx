"use client";

import { useState, type ReactNode } from "react";
import type { Word } from "./FlashcardDetails";

export type DictMeaning = {
  partOfSpeech: string;
  definitions: { definition: string; example?: string; synonyms?: string[]; antonyms?: string[] }[];
  synonyms?: string[];
  antonyms?: string[];
};

export type DictPhonetic = {
  text?: string;
  audio?: string;
};

export type ParsedDictEntry = {
  word?: string;
  phonetic?: string;
  phonetics?: DictPhonetic[];
  meanings?: DictMeaning[];
};

type DictionaryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | DictionaryValue[]
  | { [key: string]: DictionaryValue };

const DICTIONARY_METADATA_KEYS = new Set(["sourceUrl", "license", "sourceUrls"]);

function isNonEmptyValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(isNonEmptyValue);
  if (typeof value === "object") return Object.values(value).some(isNonEmptyValue);
  return true;
}

function labelize(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());
}

function normalizeAudioSrc(audio: string) {
  if (audio.startsWith("//")) return `https:${audio}`;
  return audio;
}

function DictField({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.11em] text-accent">{labelize(name)}</p>
      {children}
    </div>
  );
}

function DictText({ children }: { children: ReactNode }) {
  return <p className="m-0 text-[12px] font-medium leading-[1.55] text-text-mid">{children}</p>;
}

function DictList({ items }: { items: DictionaryValue[] }) {
  const visible = items.filter(isNonEmptyValue);
  if (visible.length === 0) return null;

  if (visible.every((item) => typeof item === "string" || typeof item === "number" || typeof item === "boolean")) {
    return <DictText>{visible.map(String).join(", ")}</DictText>;
  }

  return (
    <div className="flex flex-col gap-2">
      {visible.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <span className="flex h-[18px] w-3 shrink-0 items-center justify-center text-sm font-extrabold leading-none text-accent">-</span>
          <div className="min-w-0 flex-1">
            <DictValue value={item} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DictObject({ value, skipKeys = [] }: { value: Record<string, DictionaryValue>; skipKeys?: string[] }) {
  const skip = new Set([...DICTIONARY_METADATA_KEYS, ...skipKeys]);
  const fields = Object.entries(value).filter(([key, fieldValue]) => !skip.has(key) && isNonEmptyValue(fieldValue));
  if (fields.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {fields.map(([key, fieldValue]) => (
        key === "meanings" ? (
          <DictValue key={key} value={fieldValue} />
        ) : (
          <DictField key={key} name={key}>
            <DictValue value={fieldValue} />
          </DictField>
        )
      ))}
    </div>
  );
}

function DictValue({ value }: { value: DictionaryValue }) {
  if (!isNonEmptyValue(value)) return null;

  if (Array.isArray(value)) {
    return <DictList items={value} />;
  }

  if (typeof value === "object" && value !== null) {
    return (
      <div className="border-l border-pill pl-3">
        <DictObject value={value} />
      </div>
    );
  }

  return <DictText>{String(value)}</DictText>;
}

function PhoneticsAudio({ phonetics }: { phonetics?: DictPhonetic[] }) {
  const withAudio = (phonetics ?? []).filter((phonetic) => phonetic.audio?.trim());
  if (withAudio.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5">
      {withAudio.map((phonetic, index) => (
        <div key={`${phonetic.audio}-${index}`} className="flex flex-col gap-2 border-l border-pill pl-3">
          {phonetic.text && <DictText>{phonetic.text}</DictText>}
          <audio controls src={normalizeAudioSrc(phonetic.audio!)} className="h-8 w-full max-w-[320px]" />
          <DictObject value={phonetic as Record<string, DictionaryValue>} skipKeys={["text", "audio"]} />
        </div>
      ))}
    </div>
  );
}

function DictionaryEntry({ entry, index }: { entry: ParsedDictEntry; index: number }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.11em] text-text-light">
        Entry {index + 1}
      </p>
      <PhoneticsAudio phonetics={entry.phonetics} />
      <DictObject value={entry as Record<string, DictionaryValue>} skipKeys={["word", "phonetic", "phonetics"]} />
    </div>
  );
}

export function DictionaryData({ word, className = "" }: { word: Word; className?: string }) {
  const [dictExpanded, setDictExpanded] = useState(false);
  const dictionaryEntries = word.dictEntries?.filter(isNonEmptyValue) ?? [];

  if (dictionaryEntries.length === 0) return null;

  return (
    <div className={`overflow-hidden border-y border-pill ${className}`}>
      <div className="flex items-center justify-between gap-3 py-3">
        <p className="m-0 text-sm font-extrabold leading-none text-accent">Dictionary</p>
        <button
          onClick={() => setDictExpanded((v) => !v)}
          className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[11px] font-bold text-text-light transition-colors hover:text-accent"
        >
          {dictExpanded ? "Show less" : "Show more"}
          <span className={`inline-block text-[8px] leading-none transition-transform duration-200 ${dictExpanded ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>
      </div>
      <div className={`flex flex-col gap-4 overflow-hidden pb-3 ${dictExpanded ? "max-h-none" : "max-h-[180px] transition-[max-height] duration-300 ease-in-out"}`}>
        {dictionaryEntries.map((entry, index) => (
          <div key={`${entry.word ?? word.word}-${index}`} className={index < dictionaryEntries.length - 1 ? "border-b border-pill pb-4" : ""}>
            <DictionaryEntry entry={entry} index={index} />
          </div>
        ))}
      </div>
    </div>
  );
}
