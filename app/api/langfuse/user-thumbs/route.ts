import { getCurrentUserEmail, unauthenticatedResponse } from "@/app/lib/authUser";
import {
  getLangfuseAuthHeader,
  getLangfuseClient,
  getLangfuseConfig,
  hasLangfuseCredentials,
} from "@/app/lib/langfuse";

export const runtime = "nodejs";

const SCORE_NAME = "user-thumbs";
const PAGE_LIMIT = 100;
const MAX_PAGES = 5;

type FeedbackBody = {
  traceId?: unknown;
  messageId?: unknown;
  value?: unknown;
  kind?: unknown;
};

type LangfuseScore = {
  value?: number | boolean | null;
};

type LangfuseScoresResponse = {
  data?: LangfuseScore[];
  meta?: {
    totalPages?: number;
  };
};

function normalizeBooleanValue(value: LangfuseScore["value"]) {
  if (value === true || value === 1) return 1;
  if (value === false || value === 0) return 0;
  return null;
}

function isValidScoreValue(value: unknown): value is 0 | 1 {
  return value === 0 || value === 1;
}

function cleanIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
}

async function fetchScorePage(page: number, userId?: string) {
  const config = getLangfuseConfig();
  const authorization = getLangfuseAuthHeader(config);

  if (!authorization) {
    return Response.json(
      {
        error:
          "Missing LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY on the server.",
      },
      { status: 500 },
    );
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_LIMIT),
    name: SCORE_NAME,
    dataType: "BOOLEAN",
    fields: userId ? "score,trace" : "score",
  });
  if (userId) params.set("userId", userId);

  const res = await fetch(`${config.host}/api/public/v2/scores?${params}`, {
    headers: {
      Authorization: authorization,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const message = await res.text();
    return Response.json(
      {
        error: `Langfuse scores request failed with ${res.status}.`,
        details: message.slice(0, 500),
      },
      { status: res.status },
    );
  }

  return (await res.json()) as LangfuseScoresResponse;
}

async function fetchScoreCounts(userId?: string) {
  let positive = 0;
  let negative = 0;
  let totalPages = 1;

  for (let page = 1; page <= Math.min(totalPages, MAX_PAGES); page++) {
    const response = await fetchScorePage(page, userId);

    if (response instanceof Response) {
      return response;
    }

    for (const score of response.data ?? []) {
      const value = normalizeBooleanValue(score.value);
      if (value === 1) positive += 1;
      if (value === 0) negative += 1;
    }

    totalPages = response.meta?.totalPages ?? totalPages;
  }

  return {
    positive,
    negative,
  };
}

export async function GET(req: Request) {
  const showAll = new URL(req.url).searchParams.get("all") === "true";
  const userEmail = showAll ? undefined : (await getCurrentUserEmail()) ?? undefined;
  if (!showAll && !userEmail) return unauthenticatedResponse();

  const result = await fetchScoreCounts(userEmail);

  if (result instanceof Response) {
    return result;
  }

  const { positive, negative } = result;
  const count = positive + negative;

  return Response.json({
    summary: {
      count,
      positive,
      negative,
      positiveRate: count > 0 ? positive / count : null,
    },
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as FeedbackBody;
  const userEmail = await getCurrentUserEmail();
  if (!userEmail) return unauthenticatedResponse();

  const traceId = typeof body.traceId === "string" ? body.traceId.trim() : "";
  const messageId = typeof body.messageId === "string" ? body.messageId.trim() : "";
  const kind = typeof body.kind === "string" ? body.kind.trim() : undefined;

  if (!traceId || !messageId || !isValidScoreValue(body.value)) {
    return Response.json(
      { error: "traceId, messageId, and value (0 or 1) are required." },
      { status: 400 },
    );
  }

  if (!hasLangfuseCredentials()) {
    return Response.json(
      { error: "Missing LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY on the server." },
      { status: 500 },
    );
  }

  const langfuse = getLangfuseClient();

  langfuse.score.create({
    id: `${SCORE_NAME}-${cleanIdPart(traceId)}-${cleanIdPart(messageId)}`,
    traceId,
    name: SCORE_NAME,
    value: body.value,
    dataType: "BOOLEAN",
    comment: kind ? `Assistant response kind: ${kind}` : undefined,
    metadata: { userId: userEmail },
  });
  await langfuse.score.flush();

  return Response.json({ ok: true });
}
