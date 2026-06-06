import { StateGraph, Annotation, START, END, MemorySaver, interrupt } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { initChatModel } from "langchain/chat_models/universal";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { dictionaryLookup, type DictEntry } from "@/app/api/tools/dictionaryLookup";
import { imageSearch } from "@/app/api/tools/imageSearch";
import { similaritySearch } from "../api/tools/similaritySearch";
import type { LanguageProficiency } from "@/app/components/LanguageProficiencySelect";
import nspell from "nspell";

// ── Models ────────────────────────────────────────────────────────────────────
const senior = new ChatOpenAI({ model: "gpt-4o",      temperature: 0.3 });
const juniorStructured = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0, disableStreaming: true });
export const DEFAULT_FLASHCARD_WRITER_MODEL = "gpt-5";
export const DEFAULT_FLASHCARD_WRITER_PROVIDER = "openai";
export const DEFAULT_FLASHCARD_WRITER_REASONING = { effort: "minimal" as const };

// ── Output schemas ────────────────────────────────────────────────────────────
const senseSchema = z.object({
  definition:     z.string().describe("Concise definition in your own words, never copied from the dictionary"),
  exampleSentence:z.string().describe("Natural example sentence demonstrating real usage"),
  memoryHint:     z.string().describe("Vivid, specific mnemonic or visual hook — 1-2 sentences"),
});

export const flashcardSchema = z.object({
  word:                 z.string().describe("The flashcard headword, lowercased. Use the user's word when it is a valid dictionary headword, including gerunds/participles and derived nouns (e.g. 'dancing', 'happiness'). Only reduce ordinary inflections (e.g. 'dance' for 'dances', 'happy' for 'happier')."),
  didYouKnow:           z.string().describe("Etymology, usage pitfall, or cultural fact — 1-2 sentences"),
  linkToKnowledgeBase:  z.string().describe("1-2 sentences connecting to a past search, or empty string"),
  senses:               z.array(senseSchema).min(1).max(4).describe("One entry per distinct sense; include multiple senses only when the word has genuinely different meanings"),
});

const flashcardWriterOutputSchema = flashcardSchema.extend({
  formNote: z.string().nullable().describe("If the user submitted an ordinary inflected form (e.g. 'dances', 'danced', 'happier'), write 1-2 sentences explaining what grammatical form it is and naming the base word. Example: '\"dances\" is the third-person singular present tense of \"dance\".' Set to null if the input is already a valid dictionary headword, including forms like 'dancing' and 'happiness'."),
});

export type FlashcardData = z.infer<typeof flashcardSchema>;
export type ImageResult   = { title: string; url: string; thumbnailSrc: string; imageUrl: string; confidence: string };
export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

// ── State ─────────────────────────────────────────────────────────────────────
const inputKindEnum = z.enum(["word_lookup", "question", "other"]);
export type InputKind = z.infer<typeof inputKindEnum> | null;
export type FlashcardWriterModel = string;
export type FlashcardWriterProvider = "openai" | "anthropic";
export type FlashcardWriterReasoningEffort =
  | "none"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";
export type FlashcardWriterReasoning = {
  effort: FlashcardWriterReasoningEffort;
};

export const FlashcardState = Annotation.Root({
  userInput:         Annotation<string>,
  userEmail:         Annotation<string | null>,
  conversationHistory: Annotation<ChatHistoryMessage[]>,
  languageProficiency: Annotation<LanguageProficiency>,
  flashcardWriterModel: Annotation<FlashcardWriterModel | null>,
  flashcardWriterProvider: Annotation<FlashcardWriterProvider | null>,
  flashcardWriterReasoning: Annotation<FlashcardWriterReasoning | null>,
  pastTerms:         Annotation<string | null>,
  word:              Annotation<string>,
  inputKind:         Annotation<InputKind>,
  dictEntry:         Annotation<DictEntry[] | null>,
  dictMiss:          Annotation<boolean>,
  spellingIsCorrect: Annotation<boolean>,
  spellingCancelled: Annotation<boolean>,
  imageResults:      Annotation<ImageResult[]>,
  heroImageUrl:      Annotation<string | null>,
  flashcard:         Annotation<FlashcardData | null>,
  formNote:          Annotation<string | null>,
  textReply:         Annotation<string | null>,
  markdownReply:     Annotation<string | null>,
});

type S = typeof FlashcardState.State;

let spellCheckerPromise: ReturnType<typeof createSpellChecker> | null = null;

async function createSpellChecker() {
  const { default: dictionary } = await import("dictionary-en");
  return nspell(Buffer.from(dictionary.aff), Buffer.from(dictionary.dic));
}

function getSpellChecker() {
  spellCheckerPromise ??= createSpellChecker();
  return spellCheckerPromise;
}

function formatConversationHistory(history: ChatHistoryMessage[] | undefined) {
  if (!history?.length) return "No previous messages.";

  return history
    .slice(-12)
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n\n");
}

function getFlashcardWriterProvider(state: S) {
  return state.flashcardWriterProvider ?? DEFAULT_FLASHCARD_WRITER_PROVIDER;
}

function mapOpenAIReasoningEffort(effort: FlashcardWriterReasoningEffort) {
  return effort === "xhigh" || effort === "max" ? "high" : effort;
}

function mapAnthropicReasoningEffort(effort: FlashcardWriterReasoningEffort) {
  return effort === "minimal" ? "low" : effort;
}

async function createFlashcardWriterModel(state: S) {
  const model = state.flashcardWriterModel ?? DEFAULT_FLASHCARD_WRITER_MODEL;
  const provider = state.flashcardWriterProvider ?? DEFAULT_FLASHCARD_WRITER_PROVIDER;
  const reasoning = state.flashcardWriterReasoning ?? DEFAULT_FLASHCARD_WRITER_REASONING;

  const providerConfig =
    provider === "anthropic"
      ? {
          modelProvider: "anthropic",
          disableStreaming: true,
          outputConfig: {
            effort: mapAnthropicReasoningEffort(reasoning.effort),
          },
          thinking: { type: "adaptive" },
        }
      : {
          modelProvider: "openai",
          disableStreaming: true,
          reasoning: {
            effort: mapOpenAIReasoningEffort(reasoning.effort),
          },
        };

  return initChatModel(model, providerConfig);
}

// ── Nodes ─────────────────────────────────────────────────────────────────────

async function classifier(state: S) {
  const model = juniorStructured.withStructuredOutput(z.object({
    kind: inputKindEnum,
    word: z.string().describe("Cleaned lowercased word or short phrase if word_lookup, else empty string"),
  }))
  const res = await model.invoke([
    new SystemMessage(`Classify user input into exactly one of three categories:
- "word_lookup": a single word, short token, or short lexical phrase the user wants defined or looked up, including misspellings (e.g. "screnshot", "ephemarel"). When in doubt with a single token, choose this.
- Phrasal verbs and verb-particle expressions are ALWAYS "word_lookup", never "question" or "other", when the user enters only the phrase. Examples: "go away", "go out", "look up", "give in", "put off", "come across", "run into", "take off", "turn down", "work out".
- Definition or meaning requests for one target word or short phrase are also ALWAYS "word_lookup", even when phrased as a question. Extract only the target expression into the word field. Examples: "what does turn down mean" -> word_lookup with word "turn down"; "what does ephemeral mean" -> word "ephemeral"; "define go out" -> word "go out"; "meaning of put off" -> word "put off".
- "question": any language, grammar, vocabulary, or usage related question or comparison that is not a simple word lookup. This includes comparisons like "pretty vs nice", questions like "when do I use affect vs effect", any request for language guidance, and conversational follow-ups about an earlier explanation, flashcard, saved word, memory hint, or connection to past searches. It does NOT need to be phrased as a literal question.
- "other": input that has nothing to do with language, vocabulary, grammar, or words.

Use previous messages to resolve short follow-ups, feedback, thanks, corrections, and references like "that", "it", "the connection", or "the example". If the current input is conversational and clearly refers to a previous language, grammar, vocabulary, usage, flashcard, or word-lookup topic, classify it as "question". Do not classify non-language topics as "question" just because there is prior chat history.

IMPORTANT: a misspelled or unrecognized single token is ALWAYS "word_lookup", never "other".
Return the word lowercased/trimmed in the word field for word_lookup, else empty string.`),
    new HumanMessage(`Previous messages:
${formatConversationHistory(state.conversationHistory)}

Current user input: ${state.userInput}`),
  ]);
  return { inputKind: res.kind, word: res.word || state.userInput.toLowerCase().trim() };
}

async function questionAnswer(state: S) {
  const res = await senior.invoke([
    new SystemMessage(`You are a language learning assistant.
      You can hold a natural conversation with the learner about language, vocabulary, grammar, word meaning, word choice, pronunciation, spelling, etymology, usage, writing style, flashcards, memory hints, examples, and connections to their past searches.
      If the user gives feedback, thanks you, mentions that an explanation or connection was helpful, or asks a meta follow-up about a previous language-learning response, acknowledge it briefly and continue helpfully. Do not refuse these in-scope conversational turns just because they are not literal questions.
      If the current user input asks for anything genuinely outside that scope, politely refuse and redirect to language or vocabulary help.
      Use the previous messages to understand follow-up questions, pronouns, and references to earlier words or explanations. Do not invent context that is not in the previous messages.
      Respond in markdown. Use headers, bold, bullet points, and examples where helpful.`),
          new HumanMessage(`Previous messages:
      ${formatConversationHistory(state.conversationHistory)}

      Current question: ${state.userInput}`),
  ]);
  return { markdownReply: res.content as string };
}

function otherAnswer() {
  return {
    textReply: "I'm happy to help with any language-related questions — definitions, grammar, usage, word comparisons, and more. I'm not able to help with topics outside of language and vocabulary.",
  };
}

async function dictionaryLookupNode(state: S) {
  const res = await dictionaryLookup.invoke({ word: state.word });
  if (typeof res === "string") return { dictEntry: null, dictMiss: true };
  return { dictEntry: res as DictEntry[], dictMiss: false };
}

async function checkSpelling(state: S) {
  // for now assume phrasal verbs are spelled correctly, will handle them later
  if (state.word.split(" ").length > 1) return { spellingIsCorrect: true};

  const spellChecker = await getSpellChecker();
  const isCorrect = spellChecker.correct(state.word);
  return { spellingIsCorrect: isCorrect };
}

async function suggestSpelling(state: S) {
  const spellChecker = await getSpellChecker();
  const options = spellChecker.suggest(state.word).slice(0, 4);
  if (options.length === 0) {
    return {
      spellingCancelled: true,
      textReply: `No spelling suggestions found for "${state.word}" — try a different word.`,
    };
  }

  const selected = interrupt({ spellingOptions: options });
  if (!selected) return { spellingCancelled: true };
  return { word: selected, dictMiss: false, spellingCancelled: false };
}

async function imageSearchNode(state: S) {
  const res = await imageSearch.invoke({ word: state.word });
  if (typeof res === "string") {
    return { imageResults: [] };
  }
  return { imageResults: res as ImageResult[] };
}

async function imageRanker(state: S) {
  const model = juniorStructured.withStructuredOutput(z.object({
    selectedIndex: z.number().int().min(0).describe("0-based index of the best flashcard image"),
  }))
  const list = state.imageResults.map((r, i) => `${i}: "${r.title}" — ${r.imageUrl}`).join("\n");
  const r = await model.invoke([
    new SystemMessage("Pick the best image for a vocabulary flashcard. Prefer clear, educational, safe images that directly illustrate the word's meaning. Avoid text-heavy or watermarked images."),
    new HumanMessage(`Word: "${state.word}"\nCandidates:\n${list}`),
  ]);
  const idx = Math.min(r.selectedIndex, state.imageResults.length - 1);
  return { heroImageUrl: state.imageResults[idx]?.imageUrl ?? null };
}

async function fetchPastTerms(state: S) {
  const filter = state.userEmail ? { userEmail: state.userEmail } : undefined;
  const hits = await similaritySearch.invoke({word: state.word, filter: filter});
  const pastTerms = hits.map(([doc]) => doc.pageContent).join("\n- ");
  return { pastTerms: pastTerms || null };
}

async function flashcardWriter(state: S) {
  const provider = getFlashcardWriterProvider(state);
  const model = (await createFlashcardWriterModel(state)).withStructuredOutput(
    flashcardWriterOutputSchema,
    provider === "anthropic" ? { method: "jsonSchema" } : undefined,
  );
  const dict  = state.dictEntry!;
  const proficiency = state.languageProficiency ?? "intermediate";

 const proficiencyGuidance: Record<LanguageProficiency, string> = {
  beginner: [
    `Write for an A1–A2 beginner English learner.`,
    `Use only very common everyday words.`,
    `The definition should be 5–10 words when possible.`,
    `Do not use abstract nouns like "purpose", "intention", "choice", "decision", "action", or "concept" if a simpler phrase works.`,
    `Prefer simple explanations like "someone wanted to do it" or "it happened by mistake".`,
    `Avoid idioms, figurative language, academic words, grammar terms, and etymology.`,
    `Examples must show a clear, visible daily-life situation.`,
    `Avoid examples that reuse the target word in an abstract phrase.`,
    `Memory hints must be concrete: a person, object, place, and action the learner can picture.`,
    `The "didYouKnow" field must be a simple usage tip or contrast, not word history.`,
  ].join(" "),

  intermediate: [
    `Write for an intermediate English learner.`,
    `Use natural but accessible wording.`,
    `Include useful nuance, collocations, and common traps.`,
    `Examples should sound conversational and show how the word is normally used.`,
    `The "didYouKnow" field may include a usage pitfall, common collocation, register note, or simple word-family note.`,
  ].join(" "),

  advanced: [
    `Write for an advanced English learner.`,
    `Use precise wording, richer nuance, and examples that show register, connotation, or subtle usage.`,
    `The "didYouKnow" field may include etymology, cultural notes, register, connotation, or nuanced usage.`,
  ].join(" "),
};

  const system = `You are a vocabulary learning assistant. Create a rich, memorable flashcard.

Headword rules:
- The "word" field must be the flashcard headword.
- Keep the user's word when it is a valid dictionary headword, including gerunds/participles and derived nouns.
- Examples: "dancing" stays "dancing"; "happiness" stays "happiness".
- Only reduce ordinary grammatical inflections: plural nouns, finite verb forms, past-tense forms, and comparative/superlative adjectives.
- Examples: "dances" -> "dance"; "happier" -> "happy".
- If the input is an ordinary inflected form, set "formNote" to 1–2 simple sentences naming the form and its base word.
- Otherwise set "formNote" to null.

Content rules:
- Definitions must be in your own words. Never copy dictionary phrasing.
- Definitions must be easier than the target word.
- Example sentences must sound like real natural speech.
- Do not use the target word in a way that makes the meaning unclear.
- For beginner cards, prefer one concrete example over a general or abstract one.
- Memory hints must be vivid and specific: "Picture X doing Y", not just "Think of X".
- didYouKnow must match the learner level:
  - beginner: simple usage tip, simple contrast, or common mistake only. No etymology.
  - intermediate: usage pitfall, common collocation, register note, or word-family note.
  - advanced: etymology, cultural note, connotation, register, or subtle usage is allowed.
- linkToKnowledgeBase: one or two sentences linking to a past search if genuinely useful, else "".

Quality check before final answer:
- Is every explanation simpler than the target word?
- Is the example concrete and natural?
- For beginner level, did you avoid abstract nouns, etymology, and difficult phrases?
- If not, rewrite before answering.

Learner proficiency: 
- ${proficiency}. ${proficiencyGuidance[proficiency]}

${state.pastTerms ? `\nPast searches:\n- ${state.pastTerms}` : ""}`;

  const res = await model.invoke([
    new SystemMessage(system),
    new HumanMessage(`Word: "${state.word}"\nDictionary data:\n${JSON.stringify(dict, null, 2)}`)
  ]);
  const { formNote, ...flashcardFields } = res;
  return {
    flashcard: flashcardFields,
    word: flashcardFields.word,
    formNote: formNote ?? null,
  };
}

// ── Graph ─────────────────────────────────────────────────────────────────────
const checkpointer = new MemorySaver();

const g = new StateGraph(FlashcardState)
  .addNode("classifier",        classifier)
  .addNode("question_answer",   questionAnswer)
  .addNode("other_answer",      otherAnswer)
  .addNode("check_spelling",    checkSpelling)
  .addNode("dictionary_lookup", dictionaryLookupNode)
  .addNode("suggest_spelling",  suggestSpelling)
  .addNode("image_search",      imageSearchNode)
  .addNode("image_ranker",      imageRanker)
  .addNode("fetch_past_terms",  fetchPastTerms)
  .addNode("flashcard_writer",  flashcardWriter);

g.addEdge(START, "classifier");

g.addConditionalEdges("classifier", (s) => {
  if (s.inputKind === "question") return "question_answer";
  if (s.inputKind === "other")    return "other_answer";
  return "check_spelling";
});

g.addEdge("question_answer",  END);
g.addEdge("other_answer",     END);

g.addConditionalEdges("check_spelling", (s) =>
  s.spellingIsCorrect ? ["dictionary_lookup", "fetch_past_terms", "image_search"] : "suggest_spelling"
);

g.addConditionalEdges("suggest_spelling", (s) =>
  s.spellingCancelled ? END : ["dictionary_lookup", "fetch_past_terms", "image_search"]
);

g.addEdge("dictionary_lookup", "flashcard_writer");
g.addEdge("fetch_past_terms", "flashcard_writer");
g.addEdge("flashcard_writer", END);

g.addConditionalEdges("image_search", (s) =>
  s.imageResults.length === 0 ? END : "image_ranker"
);
g.addEdge("image_ranker", END);



export const graph = g.compile({ checkpointer });
