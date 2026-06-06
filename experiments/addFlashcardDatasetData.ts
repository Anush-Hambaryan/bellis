import { loadEnvConfig } from "@next/env";
import { LangfuseClient } from "@langfuse/client";
import {
  FLASHCARD_DATASET_NAME,
  flashcardDatasetItems,
} from "./flashcardDatasetItems";

loadEnvConfig(process.cwd());

function createLangfuseClient() {
  return new LangfuseClient({
    baseUrl: process.env.LANGFUSE_BASE_URL ?? process.env.LANGFUSE_HOST,
  });
}

async function ensureDataset(langfuse: LangfuseClient) {
  try {
    await langfuse.api.datasets.create({
      name: FLASHCARD_DATASET_NAME,
      description:
        "Synthetic flashcardWriter evaluation cases with graph inputs.",
      metadata: {
        owner: "experiments/flashcardWriter",
        criteria: [
          "correctness",
          "comprehension_helpfulness",
          "retention_helpfulness",
          "proficiency_fit",
          "overall_quality",
        ],
      },
    });
    console.log(`Created dataset "${FLASHCARD_DATASET_NAME}".`);
  } catch (error) {
    console.log(
      `Using existing dataset "${FLASHCARD_DATASET_NAME}" if it already exists.`,
    );
  }
}

async function main() {
  const langfuse = createLangfuseClient();

  await ensureDataset(langfuse);

  for (const item of flashcardDatasetItems) {
    await langfuse.api.datasetItems.create({
      id: item.id,
      datasetName: FLASHCARD_DATASET_NAME,
      input: item.input,
      metadata: item.metadata,
    });

    console.log(`Upserted dataset item ${item.id}.`);
  }

  await langfuse.flush();
  console.log(
    `Done. Added ${flashcardDatasetItems.length} items to "${FLASHCARD_DATASET_NAME}".`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
