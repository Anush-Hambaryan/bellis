import type { Word } from "@/app/components/FlashcardDetails";
import type { LanguageProficiency } from "@/app/components/LanguageProficiencySelect";
import { getCurrentUserEmail, unauthenticatedResponse } from "@/app/lib/authUser";
import { getMongoClient } from "@/app/lib/mongodb";

export const runtime = "nodejs";

type FlashcardBody = {
  flashcard?: unknown;
  word?: unknown;
  languageProficiency?: unknown;
  replace?: unknown;
};

type FlashcardDoc = {
  userEmail: string;
  normalizedWord: string;
  normalizedLanguageProficiency?: LanguageProficiency;
  flashcard: Word;
  createdAt: Date;
  updatedAt: Date;
};

const languageProficiencies = new Set<LanguageProficiency>(["beginner", "intermediate", "advanced"]);

function normalizeWord(value: string) {
  return value.trim().toLowerCase();
}

function isLanguageProficiency(value: unknown): value is LanguageProficiency {
  return typeof value === "string" && languageProficiencies.has(value as LanguageProficiency);
}

function withDefaultLanguageProficiency(flashcard: Word): Word {
  return {
    ...flashcard,
    languageProficiency: isLanguageProficiency(flashcard.languageProficiency)
      ? flashcard.languageProficiency
      : "intermediate",
  };
}

function isDefinition(value: unknown): value is Word["definitions"][number] {
  if (!value || typeof value !== "object") return false;
  const definition = value as Record<string, unknown>;
  return (
    typeof definition.text === "string" &&
    typeof definition.example === "string" &&
    typeof definition.hint === "string"
  );
}

function isWord(value: unknown): value is Word {
  if (!value || typeof value !== "object") return false;
  const word = value as Record<string, unknown>;
  return (
    typeof word.word === "string" &&
    typeof word.phonetic === "string" &&
    typeof word.pos === "string" &&
    typeof word.tag === "string" &&
    isLanguageProficiency(word.languageProficiency) &&
    typeof word.fact === "string" &&
    Array.isArray(word.definitions) &&
    word.definitions.every(isDefinition)
  );
}

async function flashcardsCollection() {
  const client = await getMongoClient();
  return client.db("lexica").collection<FlashcardDoc>("flashcards");
}

export async function GET() {
  const userEmail = await getCurrentUserEmail();
  if (!userEmail) return unauthenticatedResponse();

  const collection = await flashcardsCollection();
  const docs = await collection
    .find({ userEmail })
    .sort({ updatedAt: -1 })
    .project<{ flashcard: Word }>({ _id: 0, flashcard: 1 })
    .toArray();

  return Response.json({ flashcards: docs.map((doc) => withDefaultLanguageProficiency(doc.flashcard)) });
}

export async function POST(req: Request) {
  const body = (await req.json()) as FlashcardBody;
  const userEmail = await getCurrentUserEmail();

  if (!userEmail) return unauthenticatedResponse();

  if (!isWord(body.flashcard)) {
    return Response.json(
      { error: "A valid flashcard is required." },
      { status: 400 },
    );
  }

  const now = new Date();
  const flashcard = withDefaultLanguageProficiency(body.flashcard);
  const normalizedWord = normalizeWord(flashcard.word);
  const normalizedLanguageProficiency = flashcard.languageProficiency;
  const collection = await flashcardsCollection();
  const existingFilter = normalizedLanguageProficiency === "intermediate"
    ? {
        userEmail,
        normalizedWord,
        $or: [
          { normalizedLanguageProficiency },
          { normalizedLanguageProficiency: { $exists: false } },
        ],
      }
    : { userEmail, normalizedWord, normalizedLanguageProficiency };
  const existing = await collection.findOne(existingFilter, {
    projection: { _id: 1 },
  });

  if (existing && body.replace !== true) {
    return Response.json(
      { error: "Flashcard already exists.", code: "flashcard_exists" },
      { status: 409 },
    );
  }

  await collection.updateOne(
    existingFilter,
    {
      $set: { flashcard, normalizedLanguageProficiency, updatedAt: now },
      $setOnInsert: { userEmail, normalizedWord, createdAt: now },
    },
    { upsert: true },
  );

  return Response.json({ ok: true, flashcard });
}

export async function DELETE(req: Request) {
  const body = (await req.json()) as FlashcardBody;
  const userEmail = await getCurrentUserEmail();
  const word = typeof body.word === "string" ? body.word : "";
  const normalizedLanguageProficiency = isLanguageProficiency(body.languageProficiency)
    ? body.languageProficiency
    : "intermediate";

  if (!userEmail) return unauthenticatedResponse();

  if (!word.trim()) {
    return Response.json(
      { error: "word is required." },
      { status: 400 },
    );
  }

  const collection = await flashcardsCollection();
  const normalizedWord = normalizeWord(word);
  const result = await collection.deleteOne(
    normalizedLanguageProficiency === "intermediate"
      ? {
          userEmail,
          normalizedWord,
          $or: [
            { normalizedLanguageProficiency },
            { normalizedLanguageProficiency: { $exists: false } },
          ],
        }
      : { userEmail, normalizedWord, normalizedLanguageProficiency },
  );

  return Response.json({ ok: true, deletedCount: result.deletedCount });
}
