const FLOWER_DATA = [
  { x: "9%",  y: "18%", size: 11, delay: "0s",    dur: "28s" },
  { x: "18%", y: "62%", size: 8,  delay: "8s",    dur: "24s" },
  { x: "30%", y: "30%", size: 16, delay: "4s",    dur: "30s" },
  { x: "44%", y: "70%", size: 7,  delay: "12s",   dur: "22s" },
  { x: "57%", y: "20%", size: 12, delay: "2s",    dur: "29s" },
  { x: "70%", y: "58%", size: 9,  delay: "17s",   dur: "25s" },
  { x: "82%", y: "26%", size: 14, delay: "22s",   dur: "27s" },
  { x: "91%", y: "72%", size: 9,  delay: "10s",   dur: "31s" },
];

const PETAL_ANGLES = Array.from({ length: 20 }, (_, i) => i * 18);

export function Flowers() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {FLOWER_DATA.map((f, i) => {
        const cr  = f.size * 0.38;   // disc radius
        const tip = f.size * 1.12;   // petal tip distance from center
        const pd  = tip - cr;        // petal visible length
        const bw  = f.size * 0.10;   // half-width at base (where petal meets disc)
        const mw  = f.size * 0.135;  // half-width at widest (mid petal)
        const tw  = f.size * 0.045;  // half-width at rounded tip

        // spatula shape: starts at disc edge, widens in the middle, rounded tip
        const petal = [
          `M ${-bw} ${-cr}`,
          `C ${-mw * 1.3} ${-(cr + pd * 0.28)}, ${-mw * 1.2} ${-(cr + pd * 0.62)}, ${-tw} ${-tip}`,
          `Q 0 ${-(tip + tw * 0.9)}, ${tw} ${-tip}`,
          `C ${mw * 1.2} ${-(cr + pd * 0.62)}, ${mw * 1.3} ${-(cr + pd * 0.28)}, ${bw} ${-cr}`,
          `Z`,
        ].join(" ");

        return (
          <svg
            key={i}
            width={f.size * 3}
            height={f.size * 3}
            viewBox={`${-f.size * 1.5} ${-f.size * 1.5} ${f.size * 3} ${f.size * 3}`}
            className="absolute will-change-[transform,opacity]"
            style={{
              left: f.x, top: f.y,
              animation: `bloom ${f.dur} ease-in-out infinite`,
              animationDelay: f.delay,
            }}
          >
            {PETAL_ANGLES.map((angle, j) => (
              <g key={j} transform={`rotate(${angle})`}>
                <path d={petal} fill="#ffffff" stroke="rgba(150,145,130,0.28)" strokeWidth={f.size * 0.018} />
              </g>
            ))}
            {/* layered amber disc: dark outer ring → mid gold → bright yellow → highlight */}
            <circle cx="0" cy="0" r={cr}            fill="#a06808" opacity="0.95" />
            <circle cx="0" cy="0" r={cr * 0.82}     fill="#c88a18" opacity="1"    />
            <circle cx="0" cy="0" r={cr * 0.60}     fill="#e8b030" opacity="1"    />
            <circle cx="0" cy="0" r={cr * 0.36}     fill="#f5cc50" opacity="1"    />
            <circle cx={-cr * 0.18} cy={-cr * 0.18} r={cr * 0.16} fill="#fde87a" opacity="0.55" />
          </svg>
        );
      })}
    </div>
  );
}