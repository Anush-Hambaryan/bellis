const SPARKLE_DATA = [
  { x: "8%",  y: "15%", size: 7,  delay: "0s",    dur: "10s",  color: "#7aab82" },
  { x: "22%", y: "80%", size: 5,  delay: "5.5s",  dur: "9s",   color: "#a3c4a8" },
  { x: "38%", y: "22%", size: 9,  delay: "2.0s",  dur: "11s",  color: "#546d5a" },
  { x: "51%", y: "75%", size: 6,  delay: "8.0s",  dur: "9.5s", color: "#8aad8f" },
  { x: "64%", y: "10%", size: 8,  delay: "3.5s",  dur: "10.5s",color: "#a3c4a8" },
  { x: "74%", y: "85%", size: 5,  delay: "6.5s",  dur: "8.5s", color: "#7aab82" },
  { x: "83%", y: "30%", size: 10, delay: "1.0s",  dur: "12s",  color: "#546d5a" },
  { x: "91%", y: "65%", size: 6,  delay: "7.5s",  dur: "9.5s", color: "#c8deca" },
  { x: "46%", y: "50%", size: 4,  delay: "10.0s", dur: "8s",   color: "#a3c4a8" },
  { x: "15%", y: "50%", size: 7,  delay: "12.5s", dur: "10s",  color: "#7aab82" },
];

export function Sparkles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {SPARKLE_DATA.map((s, i) => {
        const r = s.size;
        const arm = r * 0.19;
        const d = `M 0 ${-r} L ${arm} ${-arm} L ${r} 0 L ${arm} ${arm} L 0 ${r} L ${-arm} ${arm} L ${-r} 0 L ${-arm} ${-arm} Z`;
        return (
          <svg key={i} width={r * 2.4} height={r * 2.4}
            viewBox={`${-r * 1.2} ${-r * 1.2} ${r * 2.4} ${r * 2.4}`}
            className="absolute will-change-[transform,opacity]"
            style={{
              left: s.x, top: s.y,
              animation: `sparkle ${s.dur} ease-in-out infinite`,
              animationDelay: s.delay,
            }}
          >
            <path d={d} fill={s.color} opacity="0.75" />
            <circle cx="0" cy="0" r={r * 0.28} fill="white" opacity="0.65" />
          </svg>
        );
      })}
    </div>
  );
}