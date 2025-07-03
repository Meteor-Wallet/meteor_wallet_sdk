export interface ICPBgComponent_Star {
  [prop: string]: any;
}

export const BgComponent_Star: React.FC<ICPBgComponent_Star> = () => {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      x="0"
      y="0"
      viewBox="0 0 50 50"
      // @ts-ignore
      style={{ enableBackground: "new 0 0 50 50" }}
      xmlSpace="preserve"
    >
      <path
        d="M40.73 24.6c-14.08 1.28-12.8 5.12-16 16-1.92-10.24 0-14.08-16-16 14.08-2.56 14.08-3.84 16.64-16 3.2 11.52 1.28 13.44 15.36 16z"
        style={{ fill: "#85c8ff" }}
      />
    </svg>
  );
};
