import React from "react";
import "./animate_meteor_logo.scss";

export interface ICPMeteorAnimatedLogo {
  [prop: string]: any;
}

export const MeteorAnimatedLogo: React.FC<ICPMeteorAnimatedLogo> = () => {
  return (
    <svg
      id="meteor_svg_logo"
      data-name="Layer 1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 480 450"
    >
      <defs>
        <linearGradient
          id="linear-gradient"
          x1="319.75"
          y1="882.69"
          x2="486.74"
          y2="882.69"
          gradientTransform="matrix(.79 0 0 .86 -178.94 -645.22)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset=".07" stopColor="#232371" stopOpacity=".8" />
          <stop offset=".94" stopColor="#171e9b" stopOpacity=".75" />
        </linearGradient>
        <linearGradient
          id="linear-gradient-2"
          x1="453.7"
          y1="974.62"
          x2="620.69"
          y2="974.62"
          gradientTransform="matrix(1.49 0 0 .86 -559.94 -684.4)"
        />
        <linearGradient
          id="linear-gradient-3"
          x1="470.78"
          y1="1086.98"
          x2="637.77"
          y2="1086.98"
          gradientTransform="matrix(1.66 0 0 .86 -585.38 -740.81)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset=".07" stopColor="#232371" stopOpacity=".8" />
          <stop offset=".94" stopColor="#171e9b" stopOpacity=".81" />
        </linearGradient>
        <linearGradient
          id="linear-gradient-4"
          x1="405.04"
          y1="1192.73"
          x2="572.04"
          y2="1192.73"
          gradientTransform="matrix(.97 0 0 .86 -93.54 -748.57)"
        />
        <linearGradient
          id="linear-gradient-5"
          x1="255"
          y1="925.83"
          x2="421.99"
          y2="925.83"
          gradientTransform="matrix(1.41 0 0 1 -319.65 -758.68)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset=".07" stopColor="#0f0f36" />
          <stop offset=".76" stopColor="#232371" />
        </linearGradient>
        <linearGradient
          id="tail_gradient"
          x1="325.11"
          y1="1021.4"
          x2="509.05"
          y2="1021.4"
          gradientTransform="matrix(1.72 0 0 1 -462.13 -819.2)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0f0f36" />
          <stop offset=".8" stopColor="#232371" />
        </linearGradient>
        <linearGradient
          id="linear-gradient-6"
          x1="338.6"
          y1="1114.84"
          x2="406.35"
          y2="1114.84"
          gradientTransform="matrix(2.84 0 0 1 -762.95 -818.01)"
        />
        <linearGradient
          id="main_gradient"
          x1="76.21"
          y1="1019.27"
          x2="471.23"
          y2="1019.27"
          gradientTransform="rotate(-45 -685.44 725.79)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#479ff5" />
          <stop offset=".22" stopColor="#405ee5" />
          <stop offset=".35" stopColor="#523bda" />
          <stop offset=".43" stopColor="#5a55ce" />
          <stop offset=".56" stopColor="#5a55ce" />
          <stop offset=".76" stopColor="#3b3cbb" />
          <stop offset=".87" stopColor="#171e9b" />
          <stop offset="1" stopColor="#171e9b" />
        </linearGradient>
      </defs>
      <g id="main_logo">
        <g id="outer_tails">
          <g id="g_tail_outer_1">
            <path
              id="tail_outer_1"
              d="M83.23 94.39H184a22.47 22.47 0 0 1 22.47 22.47A22.47 22.47 0 0 1 184 139.33H83.23a9 9 0 0 1-9-9v-27a9 9 0 0 1 9-9Z"
              transform="rotate(-45 140.36 116.86)"
              fill="url(#linear-gradient)"
            />
          </g>
          <g id="g_tail_outer_2">
            <path
              id="tail_outer_2"
              d="M125.09 127.48h217.84a22.27 22.27 0 0 1 22.27 22.27A22.27 22.27 0 0 1 342.93 172H125.09a8.79 8.79 0 0 1-8.79-8.79v-27a8.79 8.79 0 0 1 8.79-8.79Z"
              transform="rotate(-45 240.75 149.76)"
              fill="url(#linear-gradient)"
            />
          </g>
          <g id="g_tail_outer_3">
            <path
              id="tail_outer_3"
              d="M206.84 167.23h246.83a22.27 22.27 0 0 1 22.27 22.27 22.27 22.27 0 0 1-22.27 22.27H206.84a8.79 8.79 0 0 1-8.79-8.79V176a8.79 8.79 0 0 1 8.79-8.79Z"
              transform="rotate(-45 337 189.5)"
              fill="url(#linear-gradient-3)"
            />
          </g>
          <g id="g_tail_outer_4">
            <path
              id="tail_outer_4"
              d="M309.72 250h131.57a22.27 22.27 0 0 1 22.27 22.27 22.27 22.27 0 0 1-22.27 22.27H309.72a8.79 8.79 0 0 1-8.79-8.79v-27a8.79 8.79 0 0 1 8.79-8.75Z"
              transform="rotate(-45 382.25 272.25)"
              fill="url(#linear-gradient)"
            />
          </g>
        </g>
        <g id="inner_tails">
          <g id="g_tail_inner_1">
            <path
              id="tail_inner_1"
              d="M51.29 141.12h196.15a26 26 0 0 1 26 26 26 26 0 0 1-26 26H51.29a12.54 12.54 0 0 1-12.54-12.54v-27a12.54 12.54 0 0 1 12.54-12.54Z"
              transform="rotate(-45 156.1 167.15)"
              fill="url(#linear-gradient-5)"
            />
          </g>
          <g id="g_tail_inner_2">
            <path
              id="tail_inner_2"
              d="M110.92 175.6H388a26.59 26.59 0 0 1 26.59 26.59 26.59 26.59 0 0 1-26.59 26.6H110.92a13.11 13.11 0 0 1-13.11-13.11v-27a13.11 13.11 0 0 1 13.11-13.08Z"
              transform="rotate(-45 256.21 202.2)"
              fill="url(#tail_gradient)"
            />
          </g>
          <g id="g_tail_inner_3">
            <rect
              id="tail_inner_3"
              x="197.63"
              y="272.79"
              width="192.19"
              height="48.08"
              rx="24.04"
              transform="rotate(-45 293.73 296.83)"
              fill="url(#tail_gradient)"
            />
          </g>
        </g>
        <path
          d="M343.21 151.24 278.41 216a25.49 25.49 0 0 1-36 0 25.49 25.49 0 0 1 0-36l13.74-13.75c8.69-8.68 9.34-22.92.82-31.76a22.3 22.3 0 0 0-31.83-.29L164.27 195a25.46 25.46 0 0 1-36 0 25.49 25.49 0 0 1 0-36.05l20.26-20.27a22.29 22.29 0 0 0-.3-31.83c-8.84-8.52-23.08-7.86-31.76.82l-55 55c-.25.25-.47.52-.71.79a163.53 163.53 0 0 0 231.17 231.28l-.2-.2c.26-.24.53-.46.78-.71l97.09-97.09c8.69-8.68 9.34-22.92.82-31.76a22.3 22.3 0 0 0-31.83-.3s18.18-18.15-9.81 9.86a23.24 23.24 0 0 1-32.89 0 23.25 23.25 0 0 1 0-32.9l59.38-59.39a22.29 22.29 0 0 0-.3-31.83c-8.84-8.52-23.07-7.86-31.76.82Z"
          fill="url(#main_gradient)"
        />
        <g id="top_hightlight">
          <rect
            x="66.71"
            y="146.23"
            width="50.97"
            height="25.49"
            rx="12.74"
            transform="rotate(-45 92.2 158.98)"
            fill="#a4a1ef"
          />
          <circle cx="128.24" cy="122.93" r="12.74" fill="#c2bffc" />
        </g>
        <rect
          x="212.74"
          y="141.73"
          width="38.23"
          height="25.49"
          rx="12.74"
          transform="rotate(-45 231.85 154.47)"
          fill="#786bee"
        />
      </g>
    </svg>
  );
};
