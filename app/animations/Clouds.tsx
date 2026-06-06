const CLOUD_DATA = [
  { startX: "-280px", y: "8%",  size: 18, delay: "-60s",   dur: "600s", dir: "ltr", color: "rgba(255,255,255,0.82)"  },
  { startX: "110%",   y: "55%", size: 13, delay: "-80s",   dur: "520s", dir: "rtl", color: "rgba(245,242,235,0.78)"  },
  { startX: "-350px", y: "14%", size: 22, delay: "-200s",  dur: "680s", dir: "ltr", color: "rgba(255,255,255,0.76)"  },
  { startX: "115%",   y: "68%", size: 15, delay: "-40s",   dur: "560s", dir: "rtl", color: "rgba(245,242,235,0.80)"  },
  { startX: "-240px", y: "32%", size: 20, delay: "-320s",  dur: "640s", dir: "ltr", color: "rgba(255,255,255,0.78)"  },
  { startX: "112%",   y: "78%", size: 12, delay: "-420s",  dur: "480s", dir: "rtl", color: "rgba(245,242,235,0.75)"  },
  { startX: "-310px", y: "20%", size: 17, delay: "-140s",  dur: "620s", dir: "ltr", color: "rgba(255,255,255,0.80)"  },
  { startX: "118%",   y: "60%", size: 14, delay: "-260s",  dur: "540s", dir: "rtl", color: "rgba(245,242,235,0.78)"  },
  { startX: "-200px", y: "42%", size: 16, delay: "-60s",   dur: "580s", dir: "ltr", color: "rgba(255,255,255,0.74)"  },
  { startX: "113%",   y: "25%", size: 19, delay: "-180s",  dur: "660s", dir: "rtl", color: "rgba(245,242,235,0.80)"  },
  { startX: "-420px", y: "72%", size: 24, delay: "-360s",  dur: "720s", dir: "ltr", color: "rgba(255,255,255,0.72)"  },
  { startX: "120%",   y: "38%", size: 11, delay: "-240s",  dur: "500s", dir: "rtl", color: "rgba(245,242,235,0.76)"  },
  { startX: "-260px", y: "5%",  size: 15, delay: "-100s",  dur: "560s", dir: "ltr", color: "rgba(255,255,255,0.80)"  },
  { startX: "116%",   y: "85%", size: 13, delay: "-300s",  dur: "520s", dir: "rtl", color: "rgba(245,242,235,0.75)"  },
  { startX: "-380px", y: "48%", size: 21, delay: "-440s",  dur: "700s", dir: "ltr", color: "rgba(255,255,255,0.77)"  },
  { startX: "111%",   y: "18%", size: 10, delay: "-160s",  dur: "460s", dir: "rtl", color: "rgba(245,242,235,0.78)"  },
];

export function Clouds() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {CLOUD_DATA.map((c, i) => (
        <svg
          key={i}
          width={c.size * 5}
          height={c.size * 3}
          viewBox={`${-c.size * 2.5} ${-c.size * 1.5} ${c.size * 5} ${c.size * 3}`}
          className="absolute will-change-transform"
          style={{
            left: c.startX, top: c.y,
            animation: `cloud-${c.dir} ${c.dur} linear ${c.delay} infinite`,
          }}
        >
          <ellipse cx={0}               cy={c.size * 0.35}  rx={c.size * 1.3}  ry={c.size * 0.55} fill={c.color} />
          <circle  cx={-c.size * 0.65}  cy={0}              r={c.size * 0.48}                      fill={c.color} />
          <circle  cx={c.size * 0.05}   cy={-c.size * 0.28} r={c.size * 0.62}                      fill={c.color} />
          <circle  cx={c.size * 0.72}   cy={-c.size * 0.05} r={c.size * 0.44}                      fill={c.color} />
        </svg>
      ))}
    </div>
  );
}