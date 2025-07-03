import React from "react";

export interface ICPSvg_plainCircle {
  [prop: string]: any;
}

export const Svg_plainCircle: React.FC<ICPSvg_plainCircle> = () => {
  return (
    <svg id="svg_circle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 98">
      <defs>
        <linearGradient id="circle-gradient" x2="0.35" y2="1">
          <stop offset="-100%" stopColor="var(--color-stop)" />
          <stop offset="200%" stopColor="var(--color-bot)" />
        </linearGradient>
      </defs>
      <circle cx="49" cy="49" r="49" id="p_circle" />
    </svg>
  );
};
