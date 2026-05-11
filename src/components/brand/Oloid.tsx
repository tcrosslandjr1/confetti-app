import type { CSSProperties } from "react";

type Props = {
  className?: string;
  style?: CSSProperties;
};

/**
 * Oloid-inspired letter O: two perpendicular circles whose convex hull
 * forms the developable surface of an oloid. Approximated in 2D with two
 * crossed ellipses + a soft hull outline so it reads as a stylised "O".
 */
export function Oloid({ className, style }: Props) {
  return (
    <svg
      viewBox="-50 -50 100 100"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {/* Outer hull — the silhouette of an oloid viewed at an angle */}
      <ellipse
        cx="0"
        cy="0"
        rx="42"
        ry="36"
        transform="rotate(-18)"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinejoin="round"
      />
      {/* Two perpendicular circles that define the oloid */}
      <ellipse
        cx="0"
        cy="0"
        rx="36"
        ry="14"
        transform="rotate(35)"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        opacity="0.85"
      />
      <ellipse
        cx="0"
        cy="0"
        rx="36"
        ry="14"
        transform="rotate(-55)"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        opacity="0.6"
      />
    </svg>
  );
}
