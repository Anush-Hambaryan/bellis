import { loadEnvConfig } from "@next/env";
import {
  type Evaluation,
  type Evaluator,
  type ExperimentTask,
  LangfuseClient,
  type RunEvaluator,
} from "@langfuse/client";
import { awaitAllCallbacks } from "@langchain/core/callbacks/promises";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import type {
  FlashcardWriterModel,
  FlashcardWriterProvider,
  FlashcardWriterReasoning,
} from "../app/lib/graph";
import {
  FLASHCARD_DATASET_NAME,
  type FlashcardDatasetItem,
  type FlashcardGraphExperimentInput,
} from "./flashcardDatasetItems";

loadEnvConfig(process.cwd());
process.env.LANGFUSE_BASE_URL ??= process.env.LANGFUSE_HOST;

type FlashcardExperimentOutput = {
  flashcard: unknown;
  formNote: string | null;
  flashcardWriterModel: FlashcardWriterModel;
  flashcardWriterProvider: FlashcardWriterProvider;
  flashcardWriterReasoning: FlashcardWriterReasoning;
};

type FlashcardMetadata = FlashcardDatasetItem["metadata"];
type Graph = typeof import("../app/lib/graph")["graph"];
type CallbackHandlerCtor =
  typeof import("@langfuse/langchain")["CallbackHandler"];

let flushLangfuseSpans: (() => Promise<void>) | null = null;

const criteria = [
  "correctness",
  "completeness",
  "comprehension_helpfulness",
  "retention_helpfulness",
  "proficiency_fit",
  "overall_quality",
] as const;

type FlashcardWriterExperimentConfig = {
  provider: FlashcardWriterProvider;
  model: FlashcardWriterModel;
  reasoning: FlashcardWriterReasoning;
};

const FLASHCARD_WRITER_CONFIGS: FlashcardWriterExperimentConfig[] = [
  {
    provider: "openai",
    model: "gpt-4.1",
    reasoning: { effort: "minimal" },
  },
  {
    provider: "anthropic",
    model: "claude-haiku-4-5",
    reasoning: { effort: "low" },
  },
];

const criterionScoreSchema = z.object({
  score: z.number().int().min(1).max(5),
  reasoning: z.string(),
});

const judgeSchema = z.object({
  correctness: criterionScoreSchema,
  completeness: criterionScoreSchema,
  comprehension_helpfulness: criterionScoreSchema,
  retention_helpfulness: criterionScoreSchema,
  proficiency_fit: criterionScoreSchema,
  overall_quality: criterionScoreSchema,
});

function createLangfuseClient() {
  return new LangfuseClient({
    baseUrl: process.env.LANGFUSE_BASE_URL ?? process.env.LANGFUSE_HOST,
  });
}

const judge = new ChatOpenAI({
  model: process.env.FLASHCARD_JUDGE_MODEL ?? "gpt-5",
  disableStreaming: true,
}).withStructuredOutput(judgeSchema);

function createRunFlashcardGraph(
  graph: Graph,
  CallbackHandler: CallbackHandlerCtor,
  config: FlashcardWriterExperimentConfig,
): ExperimentTask {
  return async (item) => {
    const input = item.input as FlashcardGraphExperimentInput | undefined;
    const metadata = item.metadata as FlashcardMetadata | undefined;
    if (!input?.userInput) {
      throw new Error("Dataset item is missing input.userInput.");
    }

    const threadId = `flashcard-exp-${config.provider}-${config.model}-${config.reasoning.effort}-${metadata?.source ?? "dataset"}-${crypto.randomUUID()}`;
    const langfuseHandler = new CallbackHandler({
      sessionId: threadId,
      tags: [
        "flashcard-writer-experiment",
        config.provider,
        config.model,
        config.reasoning.effort,
      ],
    });

    const state = await graph.invoke(
      {
        ...input,
        flashcardWriterModel: config.model,
        flashcardWriterProvider: config.provider,
        flashcardWriterReasoning: config.reasoning,
      },
      {
        configurable: { thread_id: threadId },
        callbacks: [langfuseHandler],
        runName: "flashcardWriter graph evaluation",
        tags: [
          "flashcard-writer-experiment",
          config.provider,
          config.model,
          config.reasoning.effort,
        ],
        metadata: {
          langfuseSessionId: threadId,
          dataset: FLASHCARD_DATASET_NAME,
          flashcardWriterProvider: config.provider,
          flashcardWriterModel: config.model,
          flashcardWriterReasoning: config.reasoning,
        },
      },
    );

    return {
      flashcard: state.flashcard,
      formNote: state.formNote ?? null,
      flashcardWriterModel: config.model,
      flashcardWriterProvider: config.provider,
      flashcardWriterReasoning: config.reasoning,
    } satisfies FlashcardExperimentOutput;
  };
}

const judgeFlashcard: Evaluator = async ({
  input,
  output,
  metadata,
}) => {
  const typedInput = input as FlashcardGraphExperimentInput;
  const typedMetadata = metadata as FlashcardMetadata | undefined;
  const result = await judge.invoke([
    [
      "system",
      [
        "You are a strict but fair evaluator for English vocabulary flashcards.",
        "Score each criterion from 1 to 5, where 1 is poor, 3 is acceptable, and 5 is excellent.",
        "Reward accurate meaning, learner-friendly explanations, memorable examples and mnemonics, and fit to the requested proficiency.",
        "Penalize copied dictionary phrasing, wrong headword or formNote handling, vague examples, unsuitable difficulty, and noisy or misleading facts.",
        "Score missing important senses under completeness, not correctness, unless the omission makes the included content misleading.",
        "The flashcard is allowed and expected to focus on the normalized dictionary headword rather than the user's exact input when the user's input is an ordinary inflected form. In that case, evaluate whether the headword and formNote correctly explain the relationship.",
        "Do not mark a linkToKnowledgeBase reference as incorrect merely because it mentions a previous lookup that is not visible in this evaluation input. Assume the application may have supplied real past-search context unless the link is internally impossible, factually false, or misleading.",
        "Judge whether linkToKnowledgeBase helps understanding under comprehension_helpfulness, and whether it creates a memorable association under retention_helpfulness.",
        "Evaluate all criteria independently and treat them as equally important.",
      ].join(" "),
    ],
    [
      "human",
      JSON.stringify(
        {
          rubric: {
            correctness:
              "Included headword, formNote, definitions, examples, usage notes, and facts are accurate. For ordinary inflected inputs, a card about the normalized headword is correct when formNote explains the user's input. Do not penalize missing senses here unless the omission makes the included content misleading. Do not penalize linkToKnowledgeBase just for referring to past searches that are not shown to the judge.",
            completeness:
              "The flashcard covers the most important/common sense or senses appropriate for the flashcard headword and learner level. Penalize missing major everyday senses, but do not require obscure, technical, archaic, or low-frequency senses.",
            comprehension_helpfulness:
              "Definitions, examples, notes, and any linkToKnowledgeBase connection make the word easier to understand.",
            retention_helpfulness:
              "Memory hints, examples, and any linkToKnowledgeBase connection are vivid, concrete, and likely to help recall.",
            proficiency_fit:
              "Language, nuance, and didYouKnow content match the requested learner level.",
            overall_quality:
              "The flashcard is coherent, polished, useful, and free of distracting issues.",
          },
          input: typedInput,
          actualOutput: output,
          metadata: typedMetadata,
        },
        null,
        2,
      ),
    ],
  ]);

  return criteria.map((name): Evaluation => {
    const score = result[name].score;
    return {
      name,
      value: score,
      comment: `${score}/5: ${result[name].reasoning}`,
      metadata: {
        scale: "1-5 discrete integer",
        judgeModel: process.env.FLASHCARD_JUDGE_MODEL ?? "gpt-5",
        flashcardWriterModel: (output as FlashcardExperimentOutput)
          .flashcardWriterModel,
        flashcardWriterProvider: (output as FlashcardExperimentOutput)
          .flashcardWriterProvider,
        flashcardWriterReasoning: (output as FlashcardExperimentOutput)
          .flashcardWriterReasoning,
      },
    };
  });
};

const averageCriterionScores: RunEvaluator = async ({ itemResults }) => {
  return criteria.map((name): Evaluation => {
    const values = itemResults
      .flatMap((itemResult) => itemResult.evaluations)
      .filter((evaluation) => evaluation.name === name)
      .map((evaluation) => evaluation.value)
      .filter((value): value is number => typeof value === "number");

    if (values.length === 0) {
      return {
        name: `avg_${name}`,
        value: 0,
        comment: `No ${name} scores were produced.`,
      };
    }

    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    return {
      name: `avg_${name}`,
      value: average,
      comment: `Average ${name} score on a 1-5 scale: ${average.toFixed(2)}`,
    };
  });
};

async function main() {
  await import("../instrumentation.node");
  const [{ CallbackHandler }, { graph }, { langfuseSpanProcessor }] =
    await Promise.all([
      import("@langfuse/langchain"),
      import("../app/lib/graph"),
      import("../app/lib/langfuse"),
    ]);
  flushLangfuseSpans = () => langfuseSpanProcessor.forceFlush();

  const langfuse = createLangfuseClient();
  const dataset = await langfuse.dataset.get(FLASHCARD_DATASET_NAME);

  for (const flashcardWriterConfig of FLASHCARD_WRITER_CONFIGS) {
    const experimentLabel = [
      flashcardWriterConfig.provider,
      flashcardWriterConfig.model,
      flashcardWriterConfig.reasoning.effort,
    ].join(" - ");

    const result = await dataset.runExperiment({
      name: `flashcardWriter rubric evaluation - ${experimentLabel}`,
      description:
        "Runs the compiled vocabulary graph and judges flashcardWriter output across correctness, comprehension, retention, proficiency fit, and overall quality.",
      task: createRunFlashcardGraph(
        graph,
        CallbackHandler,
        flashcardWriterConfig,
      ),
      evaluators: [judgeFlashcard],
      runEvaluators: [averageCriterionScores],
      maxConcurrency: Number(process.env.FLASHCARD_EXPERIMENT_MAX_CONCURRENCY ?? 2),
      metadata: {
        app: "lexica",
        dataset: FLASHCARD_DATASET_NAME,
        task: "graph.invoke -> flashcardWriter output",
        flashcardWriterProvider: flashcardWriterConfig.provider,
        flashcardWriterModel: flashcardWriterConfig.model,
        flashcardWriterReasoning: flashcardWriterConfig.reasoning,
        judgeModel: process.env.FLASHCARD_JUDGE_MODEL ?? "gpt-5",
      },
    });

    console.log(await result.format());
  }

  await awaitAllCallbacks();
  await langfuse.flush();
  await flushLangfuseSpans?.();
}

main().catch(async (error) => {
  console.error(error);
  await awaitAllCallbacks().catch(() => undefined);
  await flushLangfuseSpans?.().catch(() => undefined);
  process.exitCode = 1;
});
