import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  viewBox: "0 0 24 24",
  width: 20,
  height: 20,
  fill: "currentColor",
  "aria-hidden": true,
  focusable: false,
};

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="6" y="5" width="4.5" height="14" rx="1" />
      <rect x="13.5" y="5" width="4.5" height="14" rx="1" />
    </svg>
  );
}

export function PrevIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="5" width="2.5" height="14" rx="0.75" />
      <path d="M18.5 5.6v12.8a1 1 0 0 1-1.55.83L8.3 13.1a1.3 1.3 0 0 1 0-2.2l8.65-6.13a1 1 0 0 1 1.55.83Z" />
    </svg>
  );
}

export function NextIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="16.5" y="5" width="2.5" height="14" rx="0.75" />
      <path d="M5.5 5.6v12.8a1 1 0 0 0 1.55.83l8.65-6.13a1.3 1.3 0 0 0 0-2.2L7.05 4.77a1 1 0 0 0-1.55.83Z" />
    </svg>
  );
}

export function SpinnerIcon(props: IconProps) {
  return (
    <svg {...base} fill="none" className="animate-spin" {...props}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M20 12a8 8 0 0 0-8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
