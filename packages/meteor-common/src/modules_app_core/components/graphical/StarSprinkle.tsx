import { Flex, FlexProps } from "@chakra-ui/react";
import React, { useState } from "react";
import { Component_RandomFloat } from "./Component_RandomFloat";
import { Svg_MeteorAbstractStar } from "./Svg_MeteorAbstractStar";

export interface ICPStarSprinkle extends FlexProps {
  amount?: number;
  size?: number;
  [props: string]: any;
}

interface IStarPosition {
  x: number;
  y: number;
  size: number;
  starIndex: number;
}

/*
 * [0 , 1 , 2*, 3 , 4 ]
 * [0*, 1 , 2 , 3 , 4*]
 * [0 , 1 , 2 , 3*, 4 ]
 * [0 , 1*, 2 , 3 , 4 ]
 * [0 , 1 , 2*, 3 , 4*]
 * */

const possiblePositions: [number, number][] = [
  [0, 1],
  [2, 0],
  [1, 3],
  [2, 4],
  [3, 2],
  [4, 1],
  [4, 4],
];

function calculateStarsAndPositions(size: number, forceAmount?: number) {
  let amount = forceAmount ?? Math.floor(Math.random() * 3) + 1;

  const starPos: IStarPosition[] = [];
  const takenIndexes: number[] = [];

  while (starPos.length < amount) {
    const [newX, newY] = possiblePositions[Math.floor(Math.random() * possiblePositions.length)];

    if (
      !starPos.some(
        ({ x, y }) =>
          x === newX || y === newY || (Math.abs(x - newX) <= 1 && Math.abs(y - newY) <= 1),
      )
    ) {
      let index = Math.floor(Math.random() * amount);

      while (takenIndexes.includes(index)) {
        index = Math.floor(Math.random() * amount);
      }

      takenIndexes.push(index);

      starPos.push({
        x: newX + Math.random(),
        y: newY + Math.random(),
        size: size + Math.random() * 0.25,
        starIndex: index,
      });
    }
  }

  return starPos;
}

const PERCENT_MULTIPLIER = 100 / 5.5;

export const StarSprinkle: React.FC<ICPStarSprinkle> = ({ amount, size = 0.4, ...props }) => {
  const [starPositions] = useState<IStarPosition[]>(() => calculateStarsAndPositions(size, amount));

  return (
    <Flex className={"star-group"} position={"absolute"} width={"100%"} height={"100%"} {...props}>
      {starPositions.map(({ x, y, size: starSize, starIndex }) => {
        return (
          <Component_RandomFloat
            range="100%"
            key={`${starIndex}-${x}-${y}`}
            className={`star-${starIndex}`}
            w={`${starSize}em`}
            h={`${starSize}em`}
            position={"absolute"}
            left={`${PERCENT_MULTIPLIER * x}%`}
            top={`${PERCENT_MULTIPLIER * y}%`}
          >
            <Svg_MeteorAbstractStar starIndex={starIndex} />
          </Component_RandomFloat>
        );
      })}
    </Flex>
  );
};
