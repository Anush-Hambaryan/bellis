import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "@langchain/core/documents";
import type { Where } from "chromadb";

export const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small"
});

function cleanUserEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeWord(value: string) {
  return value.trim().toLowerCase();
}

function userWordFilter(userEmail: string, normalizedWord: string): Where {
  return {
    $and: [
      { userEmail },
      { normalizedWord },
    ],
  };
}

export const vectorStore = new Chroma(embeddings, {
  collectionName: "expressions",
  chromaCloudAPIKey: process.env.CHROMA_API_KEY,
  clientParams: {
    host:  process.env.CHROMA_HOST,
    port: 8000,
    ssl: true,
    tenant: process.env.CHROMA_TENANT,
    database: process.env.CHROMA_DATABASE,
  },
});

export function userWordMetadataFilter(userEmail: string): Where {
  return { userEmail: cleanUserEmail(userEmail) };
}

export async function hasUserWordInVectorStore(word: string, userEmail: string) {
  const normalizedWord = normalizeWord(word);
  const normalizedUserEmail = cleanUserEmail(userEmail);
  if (!normalizedWord || !normalizedUserEmail) return false;

  const collection = await vectorStore.ensureCollection();
  const result = await collection.get({
    where: userWordFilter(normalizedUserEmail, normalizedWord),
    limit: 1,
    include: [],
  });

  return result.ids.length > 0;
}

export async function addUserWordToVectorStoreIfMissing(word: string, userEmail: string) {
  const normalizedWord = normalizeWord(word);
  const normalizedUserEmail = cleanUserEmail(userEmail);
  if (!normalizedWord || !normalizedUserEmail) return false;

  if (await hasUserWordInVectorStore(normalizedWord, normalizedUserEmail)) {
    return false;
  }

  await vectorStore.addDocuments(
    [
      new Document({
        pageContent: normalizedWord,
        metadata: {
          userEmail: normalizedUserEmail,
          normalizedWord,
          createdAt: new Date().toISOString(),
        },
      }),
    ],
    {
      ids: [
        `word:${encodeURIComponent(normalizedUserEmail)}:${encodeURIComponent(normalizedWord)}`,
      ],
    },
  );

  return true;
}
