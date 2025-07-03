import React from "react";
import "./abstract_star.scss";

export interface ICPSvg_MeteorAbstractStar {
  starIndex?: number;
}

export const Svg_MeteorAbstractStar: React.FC<ICPSvg_MeteorAbstractStar> = ({ starIndex = 0 }) => {
  return (
    <svg id="svg_star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 91 91">
      <defs>
        <linearGradient id={`star-gradient-${starIndex % 3}`} x2="1" y2="0.3">
          <stop offset="0%" stopColor="var(--star-color-start)" />
          <stop offset="30%" stopColor="var(--star-color-two)" />
          <stop offset="66%" stopColor="var(--star-color-three)" />
          <stop offset="100%" stopColor="var(--star-color-end)" />
        </linearGradient>
      </defs>
      <path
        d="M81.37 31H60V9.63A9.63 9.63 0 0 0 50.37 0h-9.74A9.63 9.63 0 0 0 31 9.63V31H9.63A9.63 9.63 0 0 0 0 40.63v9.74A9.63 9.63 0 0 0 9.63 60H31v21.37A9.63 9.63 0 0 0 40.63 91h9.74A9.63 9.63 0 0 0 60 81.37V60h21.37A9.63 9.63 0 0 0 91 50.37v-9.74A9.63 9.63 0 0 0 81.37 31Z"
        className={`p_star p_star_${starIndex % 3}`}
      />
    </svg>
  );
};
