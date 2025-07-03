import { BgComponent_MeteorBlue } from "./BgComponent_MeteorBlue";
import { BgComponent_MeteorPurple } from "./BgComponent_MeteorPurple";
import { BgComponent_Star } from "./BgComponent_Star";
import "../styles/styles-background-box-front.scss";

export interface ICPBgComponent_BackgroundBoxFront {
  [prop: string]: any;
}

export const BgComponent_BackgroundBoxFront: React.FC<ICPBgComponent_BackgroundBoxFront> = () => {
  return (
    <div className="background-box">
      <div className="element meteorBlue meteorB-ani-1">
        <BgComponent_MeteorBlue />
      </div>
      <div className="element meteorBlue meteorB-ani-2">
        <BgComponent_MeteorBlue />
      </div>
      <div className="element meteorPurple meteorP-ani-1">
        <BgComponent_MeteorPurple />
      </div>
      <div className="element meteorPurple meteorP-ani-2">
        <BgComponent_MeteorPurple />
      </div>
      <div className="element star star-pos-1 star-size-1 star-ani-1">
        <BgComponent_Star />
      </div>
      <div className="element star star-pos-2 star-size-1 star-ani-2">
        <BgComponent_Star />
      </div>
      <div className="element star star-pos-3 star-size-1 star-ani-3">
        <BgComponent_Star />
      </div>
      <div className="element star star-pos-4 star-size-1 star-ani-4">
        <BgComponent_Star />
      </div>
      <div className="element star star-pos-5 star-size-1 star-ani-5">
        <BgComponent_Star />
      </div>
      <div className="element star star-pos-6 star-size-1 star-ani-6">
        <BgComponent_Star />
      </div>
      <div className="element star star-pos-7 star-size-1 star-ani-7">
        <BgComponent_Star />
      </div>
    </div>
  );
};
