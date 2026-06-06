import { Command } from "@langchain/langgraph";
import { graph, type ChatHistoryMessage, type FlashcardData, type InputKind } from "@/app/lib/graph";

import { awaitAllCallbacks } from "@langchain/core/callbacks/promises";
import { CallbackHandler } from "@langfuse/langchain";
import { propagateAttributes } from "@langfuse/core";
import { langfuseSpanProcessor } from "@/app/lib/langfuse";
import { getCurrentUserEmail, unauthenticatedResponse } from "@/app/lib/authUser";
import { addUserWordToVectorStoreIfMissing } from "@/app/lib/vectorStore";
import type { LanguageProficiency } from "@/app/components/LanguageProficiencySelect";
import type { ProgressStatus, ProgressStep } from "@/app/components/WordLookupProgress";

export const runtime = "nodejs";

type GraphStreamInput = Parameters<typeof graph.streamEvents>[0];
type UpdateEventData = {
  node?: string;
  values?: {
    inputKind?: InputKind;
    dictEntry?: unknown;
    imageResults?: unknown[];
    heroImageUrl?: string | null;
    flashcard?: FlashcardData;
    formNote?: string | null;
    textReply?: string | null;
  };
};
type LifecycleEventData = {
  event?: ProgressStatus;
  graph_name?: string;
};

const languageProficiencies = new Set<LanguageProficiency>(["beginner", "intermediate", "advanced"]);
const progressSteps = new Set<ProgressStep>(["dictionary_lookup", "fetch_past_terms","image_search", "image_ranker","flashcard_writer"]);


const enc = new TextEncoder();
const sse = (data: unknown) => enc.encode(`data: ${JSON.stringify(data)}\n\n`);

function write(ctrl: ReadableStreamDefaultController, data: unknown) {
  ctrl.enqueue(sse(data));
}

function writeTrace(ctrl: ReadableStreamDefaultController, langfuseHandler: CallbackHandler) {
  if (langfuseHandler.last_trace_id) {
    write(ctrl, { type: "trace", traceId: langfuseHandler.last_trace_id });
  }
}

function writeProgress(ctrl: ReadableStreamDefaultController, step: ProgressStep, status: ProgressStatus) {
  write(ctrl, { type: "progress", step, status });
}

function isProgressStep(value: unknown): value is ProgressStep {
  return typeof value === "string" && progressSteps.has(value as ProgressStep);
}

function textDeltaFromMessageEvent(data: unknown) {
  if (typeof data !== "object" || data === null) return null;
  const event = data as { event?: unknown; delta?: { type?: unknown; text?: unknown } };
  return event.event === "content-block-delta" &&
    event.delta?.type === "text-delta" &&
    typeof event.delta.text === "string"
    ? event.delta.text
    : null;
}

export async function POST(req: Request) {
  const body = await req.json() as {
    threadId: string;
    userInput?: string;
    previousMessages?: ChatHistoryMessage[];
    languageProficiency?: LanguageProficiency;
    resume?: string | null;
  };
  const userEmail = await getCurrentUserEmail();
  if (!userEmail) return unauthenticatedResponse();

  const config = { configurable: { thread_id: body.threadId } };
  const languageProficiency = languageProficiencies.has(body.languageProficiency ?? "intermediate")
    ? body.languageProficiency ?? "intermediate"
    : "intermediate";

  const input: GraphStreamInput = body.resume !== undefined
    ? new Command({ resume: body.resume ?? null })
    : {
        userInput: body.userInput ?? "",
        userEmail,
        conversationHistory: body.previousMessages ?? [],
        languageProficiency,
      };

  const langfuseHandler = new CallbackHandler({
    sessionId: body.threadId,
    userId: userEmail
  });

  const stream = new ReadableStream({
    async start(ctrl) {

      try {
        await propagateAttributes(
          { userId: userEmail, sessionId: body.threadId },
          async () => {

              const run = await graph.streamEvents(input, {
                ...config,
                version: "v3",
                callbacks: [langfuseHandler],
                runName: "chat-response",
                metadata: {
                  langfuseSessionId: body.threadId,
                  langfuseUserId: userEmail,
                },
              });

const runState: {
                dictEntry?: unknown;
                heroImageUrl?: string | null;
                flashcard?: FlashcardData | null;
                formNote?: string | null;
              } = {};
              let imageBranchDone = false;
              let streamedFlashcard = false;

              for await (const event of run) {
                if (event.method === "updates") {
                  const update = event.params.data as UpdateEventData;
                  const values = update.values ?? {};
                  Object.assign(runState, values);

                  if (update.node === "classifier" && values.inputKind) {
                    write(ctrl, { type: "kind", kind: values.inputKind });
                  }

                  if (values.textReply && (update.node === "other_answer" || update.node === "suggest_spelling")) {
                    write(ctrl, { type: "text", text: values.textReply });
                  }

                  if (
                    update.node === "image_ranker" ||
                    (update.node === "image_search" && Array.isArray(values.imageResults) && values.imageResults.length === 0)
                  ) {
                    imageBranchDone = true;
                  }

                  if (runState.flashcard && imageBranchDone && !streamedFlashcard) {
                    streamedFlashcard = true;
                    write(ctrl, {
                      type: "flashcard",
                      flashcard: { ...runState.flashcard, heroImageUrl: runState.heroImageUrl },
                      dictEntry: runState.dictEntry,
                      formNote: runState.formNote ?? null,
                    });
                    await addUserWordToVectorStoreIfMissing(runState.flashcard.word, userEmail)
                      .catch(() => {});
                  }
                  continue;
                }

                if (event.method === "messages") {
                  const delta = textDeltaFromMessageEvent(event.params.data);
                  if (event.params.node === "question_answer" && delta !== null) {
                    write(ctrl, { type: "markdownDelta", delta });
                  }
                  continue;
                }

                if (event.method === "lifecycle") {
                  const lifecycle = event.params.data as LifecycleEventData;
                  const step = isProgressStep(lifecycle.graph_name)
                    ? lifecycle.graph_name
                    : null;
                  const status = lifecycle.event;
                  if (step && status) {
                    writeProgress(ctrl, step, status);
                  }
                }
              }

              if (run.interrupted) {
                const payload = run.interrupts[0].payload as {spellingOptions: string[]};
                write(ctrl, { type: "interrupt", ...payload });
              }

            writeTrace(ctrl, langfuseHandler);
            ctrl.close();
          },
        );
      } catch (err) {
          console.log("err", err)
          write(ctrl, { type: "error" });
          ctrl.close();
      } finally {
        await awaitAllCallbacks();
        await langfuseSpanProcessor.forceFlush();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
