import type {
  ChatHistoryMessage,
  FlashcardWriterProvider,
  FlashcardWriterReasoning,
  FlashcardWriterModel,
} from "../app/lib/graph";
import type { LanguageProficiency } from "../app/components/LanguageProficiencySelect";

export type FlashcardGraphExperimentInput = {
  userInput: string;
  conversationHistory: ChatHistoryMessage[];
  languageProficiency: LanguageProficiency;
  flashcardWriterModel?: FlashcardWriterModel;
  flashcardWriterProvider?: FlashcardWriterProvider;
  flashcardWriterReasoning?: FlashcardWriterReasoning;
};

export type FlashcardDatasetItem = {
  id: string;
  input: FlashcardGraphExperimentInput;
  metadata: {
    source: string;
  };
};

export const FLASHCARD_DATASET_NAME =
  process.env.FLASHCARDS_DATASET_NAME ?? "flashcards";

export const flashcardDatasetItems: FlashcardDatasetItem[] = [
  {
    id: "flashcard-deliberate-beginner",
    input: {
      userInput: "deliberate",
      languageProficiency: "beginner",
      conversationHistory: [],
    },
    metadata: {
      source: "synthetic",
    },
  },
  {
    id: "flashcard-reluctant-intermediate",
    input: {
      userInput: "reluctant",
      languageProficiency: "intermediate",
      conversationHistory: [],
    },
    metadata: {
      source: "synthetic",
    },
  },
  {
    id: "flashcard-ephemeral-advanced",
    input: {
      userInput: "ephemeral",
      languageProficiency: "advanced",
      conversationHistory: [],
    },
    metadata: {
      source: "synthetic",
    },
  },
  {
    id: "flashcard-happier-form-beginner",
    input: {
      userInput: "happier",
      languageProficiency: "beginner",
      conversationHistory: [],
    },
    metadata: {
      source: "synthetic",
    },
  },
  {
    id: "flashcard-bark-intermediate",
    input: {
      userInput: "bark",
      languageProficiency: "intermediate",
      conversationHistory: [],
    },
    metadata: {
      source: "synthetic",
    },
  },
];
