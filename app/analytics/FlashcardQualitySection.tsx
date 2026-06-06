"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FlashcardQualityDistributionItem = {
  score: string;
  count: number;
};

type FlashcardQualityResponse = {
  truncated: boolean;
  summary: {
    count: number;
    average: number | null;
  };
  distribution: FlashcardQualityDistributionItem[];
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: FlashcardQualityResponse }
  | { status: "error"; message: string };

type ChartTooltipPayload = {
  value?: number | string;
};

function QualityTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-[10px] border border-pill bg-card px-3 py-2 text-xs font-semibold text-text-main shadow-analytics-tooltip">
      <span className="text-text-light">Scores: </span>
      {payload[0]?.value}
    </div>
  );
}

function ScoreStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "accent";
}) {
  const toneClass =
    tone === "accent"
      ? "border-accent-tint bg-accent-wash text-accent"
      : "";

  return (
    <div className={`rounded-[14px] border px-[15px] py-[13px] ${toneClass}`}>
      <p className="mb-[7px] text-[9px] font-bold tracking-[0.08em] text-text-light uppercase">
        {label}
      </p>
      <p className="mb-[5px] text-2xl leading-none font-extrabold">
        {value}
      </p>
      <p className="m-0 text-[11px] text-text-mid">{sub}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-[404px] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-soft border-t-accent" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[404px] items-center justify-center text-xs text-text-light">
      {message}
    </div>
  );
}

type FlashcardQualitySectionProps = {
  userEmail?: string;
  allUsers?: boolean;
};

export function FlashcardQualitySection({ userEmail, allUsers = false }: FlashcardQualitySectionProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (!allUsers && !userEmail) return;

    const url = allUsers
      ? "/api/langfuse/flashcard-quality?all=true"
      : "/api/langfuse/flashcard-quality";

    fetch(url)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          throw new Error(
            body.error ?? "Failed to load flashcard_overall_quality scores.",
          );
        }
        return body as FlashcardQualityResponse;
      })
      .then((data) => setState({ status: "ready", data }))
      .catch((error: Error) =>
        setState({
          status: "error",
          message: error.message,
        }),
      );
  }, [allUsers, userEmail]);

  const distribution =
    state.status === "ready" ? state.data.distribution : [];

  return (
    <div className="mb-5 w-full rounded-[24px] bg-card p-5 shadow-analytics-card sm:px-7 sm:py-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="mb-[3px] text-[15px] font-bold tracking-normal text-text-main">
            Flashcard Quality
          </h2>
          <p className="m-0 text-xs text-text-light">
            How polished and useful generated flashcards are
          </p>
        </div>
      </div>

      {state.status === "loading" ? (
        <LoadingState />
      ) : state.status === "error" ? (
        <EmptyState message={state.message} />
      ) : state.data.summary.count === 0 ? (
        <EmptyState message="No overall quality results found yet." />
      ) : (
        <>
          <div className="mb-[18px] grid gap-3 sm:grid-cols-2">
            <ScoreStat
              label="Average Quality"
              value={state.data.summary.average?.toFixed(2) ?? "-"}
              sub="higher means better cards"
              tone="accent"
            />
            <ScoreStat
              label="Cards Checked"
              value={String(state.data.summary.count)}
              sub={state.data.truncated ? "recent cards only" : "reviewed by an LLM"}
              tone="accent"
            />
          </div>

          <div className="rounded-2xl border border-pill bg-white/60 px-4 pt-4 pb-2 shadow-analytics-panel">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <p className="m-0 text-[13px] font-bold text-text-main">
                Quality Breakdown
              </p>
              <p className="m-0 text-[11px] font-semibold text-text-light">
                scores from 1 to 5
              </p>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={distribution} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-pill-grid)" vertical={false} />
                <XAxis dataKey="score" tick={{ fontSize: 10, fill: "var(--color-text-light)" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--color-text-light)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={<QualityTooltip />}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={30}>
                  {distribution.map((entry) => {
                    const fill =
                      entry.score === "5"
                        ? "var(--color-accent-deep)"
                        : entry.score === "4"
                          ? "var(--color-accent-mid)"
                          : entry.score === "3"
                            ? "var(--color-accent-muted)"
                            : "var(--color-accent-mist)";

                    return <Cell key={entry.score} fill={fill} />;
                  })}
                  <LabelList
                    dataKey="count"
                    position="top"
                    offset={8}
                    formatter={(value) =>
                      typeof value === "number" && value > 0 ? value : ""
                    }
                    fill="var(--color-text-light)"
                    fontSize={10}
                    fontWeight={700}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
