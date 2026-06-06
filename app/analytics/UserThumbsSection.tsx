"use client";

import { useEffect, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type UserThumbsResponse = {
  summary: {
    count: number;
    positive: number;
    negative: number;
    positiveRate: number | null;
  };
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: UserThumbsResponse }
  | { status: "error"; message: string };

type ChartTooltipPayload = {
  name?: string;
  value?: number | string;
};

function FeedbackTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0];

  return (
    <div className="rounded-[10px] border border-pill bg-card px-3 py-2 text-xs font-semibold text-text-main shadow-analytics-tooltip">
      <span className="text-text-light">{item?.name}: </span>
      {item?.value}
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
  tone: "red" | "accent";
}) {
  const toneClass =
    tone === "red"
      ? "border-feedback-negative-tint bg-feedback-negative-wash text-feedback-negative"
      : "border-accent-tint bg-accent-wash text-accent";

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

type UserThumbsSectionProps = {
  userEmail?: string;
  allUsers?: boolean;
};

export function UserThumbsSection({ userEmail, allUsers = false }: UserThumbsSectionProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (!allUsers && !userEmail) return;

    const url = allUsers
      ? "/api/langfuse/user-thumbs?all=true"
      : "/api/langfuse/user-thumbs";

    fetch(url)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body.error ?? "Failed to load user-thumbs scores.");
        }
        return body as UserThumbsResponse;
      })
      .then((data) => setState({ status: "ready", data }))
      .catch((error: Error) =>
        setState({
          status: "error",
          message: error.message,
        }),
      );
  }, [allUsers, userEmail]);

  return (
    <div className="mb-5 w-full rounded-[24px] bg-card p-5 shadow-analytics-card sm:px-7 sm:py-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="mb-[3px] text-[15px] font-bold tracking-normal text-text-main">
            User Feedback
          </h2>
          <p className="m-0 text-xs text-text-light">
            Direct thumbs feedback on assistant responses
          </p>
        </div>
      </div>

      {state.status === "loading" ? (
        <LoadingState />
      ) : state.status === "error" ? (
        <EmptyState message={state.message} />
      ) : state.data.summary.count === 0 ? (
        <EmptyState message="No user-thumbs scores found yet." />
      ) : (
        <>
          <div className="mb-[18px] grid gap-3 sm:grid-cols-2">
            <ScoreStat
              label="Thumbs Up"
              value={
                state.data.summary.positiveRate === null
                  ? "-"
                  : `${Math.round(state.data.summary.positiveRate * 100)}%`
              }
              sub={`${state.data.summary.positive} positive responses`}
              tone="accent"
            />
            <ScoreStat
              label="Thumbs Down"
              value={
                state.data.summary.positiveRate === null
                  ? "-"
                  : `${Math.round((1 - state.data.summary.positiveRate) * 100)}%`
              }
              sub={`${state.data.summary.negative} negative responses`}
              tone="red"
            />
          </div>

          <div className="rounded-2xl border border-pill bg-white/60 p-4 shadow-analytics-panel">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <p className="m-0 text-[13px] font-bold text-text-main">
                Feedback Breakdown
              </p>
              <p className="m-0 text-[11px] font-semibold text-text-light">
                {state.data.summary.count} total responses
              </p>
            </div>
            <div className="grid items-center gap-[18px] min-[680px]:grid-cols-[minmax(190px,0.82fr)_minmax(0,1fr)]">
              <div className="relative h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { label: "Down", value: state.data.summary.negative, fill: "var(--color-feedback-negative)" },
                        { label: "Up", value: state.data.summary.positive, fill: "var(--color-accent-mid)" },
                      ]}
                      dataKey="value"
                      nameKey="label"
                      innerRadius="62%"
                      outerRadius="90%"
                      paddingAngle={state.data.summary.positive > 0 && state.data.summary.negative > 0 ? 2 : 0}
                      stroke="var(--color-card)"
                      strokeWidth={3}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell fill="var(--color-feedback-negative)" />
                      <Cell fill="var(--color-accent-mid)" />
                    </Pie>
                    <Tooltip
                      content={<FeedbackTooltip />}
                      cursor={{ fill: "transparent" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="m-0 text-[26px] leading-none font-[850] text-accent">
                    {state.data.summary.positiveRate === null
                      ? "-"
                      : `${Math.round(state.data.summary.positiveRate * 100)}%`}
                  </p>
                  <p className="mt-[3px] mb-0 text-[11px] font-bold text-text-light">
                    positive
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 self-center">
                {[
                  {
                    label: "Thumbs up",
                    dotClassName: "bg-accent",
                    className: "border-accent-tint bg-accent-wash",
                  },
                  {
                    label: "Thumbs down",
                    dotClassName: "bg-feedback-negative",
                    className: "border-feedback-negative-tint bg-feedback-negative-wash",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 rounded-full border px-2.5 py-[7px] ${item.className}`}
                  >
                    <div className="flex min-w-0 items-center gap-[9px]">
                      <span className={`h-[9px] w-[9px] shrink-0 rounded-full ${item.dotClassName}`} />
                      <span className="text-xs font-[750] text-text-mid">{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
