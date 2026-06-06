"use client";
import { useEffect, useRef } from "react";

interface Point3D { x: number; y: number; z: number; text: string; }

export default function PlotlyScatter3D({ points }: { points: Point3D[] }) {
  const divRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plotlyRef = useRef<any>(null);

  useEffect(() => {
    const plotDiv = divRef.current;
    if (!plotDiv || !points.length) return;
    let alive = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let Plotly: any = null;
    const styles = getComputedStyle(plotDiv);
    const markerColor = styles.getPropertyValue("--color-accent").trim();
    const gridColor = styles.getPropertyValue("--color-chart-grid").trim();
    const tickColor = styles.getPropertyValue("--color-text-light").trim();

    import("plotly.js-dist").then((P) => {
      Plotly = P;
      plotlyRef.current = P;
      if (!alive) return;
      Plotly.newPlot(
        plotDiv,
        [{
          type: "scatter3d",
          mode: "markers",
          x: points.map(p => p.x),
          y: points.map(p => p.y),
          z: points.map(p => p.z),
          hovertext: points.map(p => p.text),
          hovertemplate: "<b>%{hovertext}</b><extra></extra>",
          marker: { size: 5, color: markerColor, opacity: 0.82 },
        }],
        {
          margin: { t: 0, l: 0, r: 0, b: 0 },
          paper_bgcolor: "transparent",
          scene: {
            bgcolor: "transparent",
            domain: { y: [0.18, 1] },
            xaxis: { showgrid: true, gridcolor: gridColor, showticklabels: true, tickfont: { size: 9, color: tickColor }, nticks: 5, title: { text: "" }, zeroline: false },
            yaxis: { showgrid: true, gridcolor: gridColor, showticklabels: true, tickfont: { size: 9, color: tickColor }, nticks: 5, title: { text: "" }, zeroline: false },
            zaxis: { showgrid: true, gridcolor: gridColor, showticklabels: true, tickfont: { size: 9, color: tickColor }, nticks: 5, title: { text: "" }, zeroline: false },
          },
        },
        { responsive: true, displayModeBar: false }
      );
    });

    return () => {
      alive = false;
      plotlyRef.current = null;
      if (Plotly) Plotly.purge(plotDiv);
    };
  }, [points]);

  function zoom(factor: number) {
    const plotDiv = divRef.current;
    const Plotly = plotlyRef.current;
    if (!plotDiv || !Plotly) return;

    const fullLayout = (plotDiv as HTMLDivElement & {
      _fullLayout?: { scene?: { camera?: { eye?: { x: number; y: number; z: number } } } };
    })._fullLayout;
    const eye = fullLayout?.scene?.camera?.eye ?? { x: 1.25, y: 1.25, z: 1.25 };

    Plotly.relayout(plotDiv, {
      "scene.camera.eye": {
        x: eye.x * factor,
        y: eye.y * factor,
        z: eye.z * factor,
      },
    });
  }

  return (
    <div className="relative h-[340px] w-full">
      <div ref={divRef} className="h-full w-full" />
      <div className="absolute top-2 right-2 flex overflow-hidden rounded-[10px] border border-pill bg-card shadow-card">
        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => zoom(0.82)}
          className="h-8 w-8 cursor-pointer border-0 border-r border-solid border-r-pill bg-transparent text-lg leading-8 font-bold text-text-main"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => zoom(1.22)}
          className="h-8 w-8 cursor-pointer border-0 bg-transparent text-xl leading-8 font-bold text-text-main"
        >
          -
        </button>
      </div>
    </div>
  );
}
