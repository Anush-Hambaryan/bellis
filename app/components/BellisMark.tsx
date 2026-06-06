import type { SVGProps } from "react";

type BellisMarkProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function BellisMark({ size = 22, className = "shrink-0", ...props }: BellisMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <g fill="#546d5a">
        <ellipse cx="256" cy="128" rx="45" ry="91" />
        <ellipse cx="256" cy="384" rx="45" ry="91" />
        <ellipse cx="128" cy="256" rx="91" ry="45" />
        <ellipse cx="384" cy="256" rx="91" ry="45" />
        <ellipse cx="165" cy="165" rx="45" ry="86" transform="rotate(-45 165 165)" />
        <ellipse cx="347" cy="165" rx="45" ry="86" transform="rotate(45 347 165)" />
        <ellipse cx="165" cy="347" rx="45" ry="86" transform="rotate(45 165 347)" />
        <ellipse cx="347" cy="347" rx="45" ry="86" transform="rotate(-45 347 347)" />
      </g>
      <circle cx="256" cy="256" r="72" fill="#fff" />
      <circle cx="256" cy="256" r="42" fill="#546d5a" />
    </svg>
  );
}
