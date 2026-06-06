import { tool } from "langchain";
import { z } from "zod";

export type DictEntry = {
  word: string;
  phonetic?: string;
  phonetics?: {
    text?: string;
    audio?: string;
  }[];
  meanings: {
    partOfSpeech: string;
    definitions: { definition: string; example?: string; synonyms?: string[]; antonyms?: string[] }[];
    synonyms?: string[];
    antonyms?: string[];
  }[];
};

export const dictionaryLookup = tool(
  async ({ word }) => {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim().toLowerCase())}`
    );
    if (!res.ok) return `No definition found for "${word}".`;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0)
      return `No definition found for "${word}".`;

    return data as DictEntry[];
  },
  {
    name: "dictionary_lookup",
    description:
      "Look up the official definition, pronunciation, part of speech, usage examples, and synonyms for any English word using the Free Dictionary API.",
    schema: z.object({
      word: z.string().describe("The English word to look up"),
    }),
  }
);
