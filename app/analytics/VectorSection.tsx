"use client";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ZAxis,
} from "recharts";
import Plotly3D from "./PlotlyScatter3D";

interface Point2D { x: number; y: number; text: string; }
interface Point3D { x: number; y: number; z: number; text: string; }
interface VectorData {
  pcaPoints:   Point2D[];
  pcaPoints3d: Point3D[];
  totalVectors?: number;
  mode?: "all" | "user";
  error?: string;
}

function ScatterTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point2D }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[10px] border border-pill bg-card px-3 py-2 text-xs font-semibold text-text-main shadow-card-lg">
      {payload[0]?.payload?.text}
    </div>
  );
}

function ChartCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="box-border h-[420px] rounded-[20px] bg-card px-[22px] py-5 shadow-card max-[900px]:px-4 max-[900px]:py-[18px]">
      <p className="mb-0.5 text-[13px] font-bold tracking-[-0.01em] text-text-main">
        {title}
      </p>
      <p className="mb-4 text-[11px] text-text-light">{sub}</p>
      {children}
    </div>
  );
}

function EmptyState({ message = "Search at least 4 words to see their embedding space" }: { message?: string }) {
  return (
    <div className="flex h-[420px] flex-col items-center justify-center gap-2.5">
      <svg className="text-text-light" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8M12 8v8" />
      </svg>
      <p className="m-0 text-xs text-text-light">{message}</p>
    </div>
  );
}

function PCACharts({ pca, pca3d }: { pca: Point2D[]; pca3d: Point3D[] }) {
  const pca2 = pca.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  const pca3 = pca3d.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));
  return (
    <div className="grid gap-4 min-[901px]:grid-cols-2">
      <ChartCard title="PCA — 2D" sub="Hover for word">
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-pill)" />
            <XAxis dataKey="x" type="number" name="PC1"
              tick={{ fontSize: 9, fill: "var(--color-text-light)" }} axisLine={false} tickLine={false} />
            <YAxis dataKey="y" type="number" name="PC2"
              tick={{ fontSize: 9, fill: "var(--color-text-light)" }} axisLine={false} tickLine={false} />
            <ZAxis range={[44, 44]} />
            <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={pca2} fill="var(--color-accent)" fillOpacity={0.78} />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="PCA — 3D" sub="Drag to rotate · hover for word · swipe up to zoom out · swipe down to zoom in">
        <Plotly3D points={pca3} />
      </ChartCard>
    </div>
  );
}

type VectorSectionProps = {
  userEmail?: string;
  allUsers?: boolean;
  explainClusters?: boolean;
};

export function VectorSection({ userEmail, allUsers = false, explainClusters = false }: VectorSectionProps) {
  const [data, setData] = useState<VectorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!allUsers && !userEmail) {
      return;
    }

    const url = allUsers
      ? "/api/vectors?all=true"
      : `/api/vectors?userEmail=${encodeURIComponent(userEmail ?? "")}`;

    fetch(url)
      .then(async r => {
        const body = await r.json();
        if (!r.ok) {
          throw new Error(body.error ?? "Failed to load vector analytics");
        }
        return body as VectorData;
      })
      .then(setData)
      .catch((error: Error) => setData({
        pcaPoints: [],
        pcaPoints3d: [],
        error: error.message,
      }))
      .finally(() => setLoading(false));
  }, [allUsers, userEmail]);

  return (
    <div className="mb-5 rounded-[24px] bg-card px-7 py-6 shadow-card-lg max-[900px]:px-[18px] max-[900px]:py-5">
      <div className="mb-5">
        <h2 className="mb-[3px] text-[15px] font-bold tracking-[-0.01em] text-text-main">
          Word Embedding Space
        </h2>
        {explainClusters ? (
          <p className="m-0 text-xs text-text-light">
            Each dot is a word you have searched. Similar words appear closer together.
          </p>
        ) : (
          <p className="m-0 text-xs text-text-light">
            Semantic clusters from {allUsers ? "all searched words" : "your searched words"} — reduced to 2D and 3D via PCA
          </p>
        )}
      </div>

      {!allUsers && !userEmail ? (
        <EmptyState />
      ) : loading ? (
        <div className="flex h-[420px] flex-col items-center justify-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-soft border-t-accent" />
          <p className="m-0 text-center text-xs text-text-light">
            Initial load may take several seconds due to serverless cold starts.
          </p>
        </div>
      ) : data?.error ? (
        <EmptyState message={data.error} />
      ) : !data?.pcaPoints.length ? (
        <EmptyState
          message={
            allUsers
              ? `Only ${data?.totalVectors ?? 0} saved vectors found across all users. At least 4 are needed.`
              : "Search at least 4 words to see their embedding space"
          }
        />
      ) : (
        <PCACharts pca={data.pcaPoints} pca3d={data.pcaPoints3d} />
      )}
    </div>
  );
}
