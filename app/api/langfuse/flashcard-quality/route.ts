import { getCurrentUserEmail, unauthenticatedResponse } from "@/app/lib/authUser";
import {
  getLangfuseAuthHeader,
  getLangfuseConfig,
} from "@/app/lib/langfuse";

const SCORE_NAME = "flashcard_overall_quality";
const PAGE_LIMIT = 100;
const MAX_PAGES = 5;

type LangfuseScore = {
  value?: number | null;
};

type LangfuseScoresResponse = {
  data?: LangfuseScore[];
  meta?: {
    totalPages?: number;
  };
};

type DistributionScore = 1 | 2 | 3 | 4 | 5;

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
    source: "EVAL",
    dataType: "NUMERIC",
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

async function fetchQualityStats(userId?: string) {
  const values: number[] = [];
  const distribution = new Map<DistributionScore, number>(
    [1, 2, 3, 4, 5].map((score) => [score as DistributionScore, 0]),
  );
  let totalPages = 1;

  for (let page = 1; page <= Math.min(totalPages, MAX_PAGES); page++) {
    const response = await fetchScorePage(page, userId);

    if (response instanceof Response) {
      return response;
    }

    for (const score of response.data ?? []) {
      if (typeof score.value !== "number") continue;

      values.push(score.value);
      if (isDistributionScore(score.value)) {
        distribution.set(score.value, (distribution.get(score.value) ?? 0) + 1);
      }
    }

    totalPages = response.meta?.totalPages ?? totalPages;
  }

  const average =
    values.length > 0
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;

  return {
    summary: {
      count: values.length,
      average,
    },
    distribution: [...distribution].map(([score, count]) => ({
      score: String(score),
      count,
    })),
    truncated: totalPages > MAX_PAGES,
  };
}

function isDistributionScore(value: number): value is DistributionScore {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export async function GET(req: Request) {
  const showAll = new URL(req.url).searchParams.get("all") === "true";
  const userEmail = showAll ? undefined : (await getCurrentUserEmail()) ?? undefined;
  if (!showAll && !userEmail) return unauthenticatedResponse();

  const result = await fetchQualityStats(userEmail);

  if (result instanceof Response) {
    return result;
  }

  return Response.json(result);
}
