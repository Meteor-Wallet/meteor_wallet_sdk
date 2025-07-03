import { Box, BoxProps } from "@chakra-ui/react";
import { PropsWithChildren, useLayoutEffect, useState } from "react";

export const Component_RandomFloat: React.FC<
  PropsWithChildren<{
    /**
     * By miliseconds
     */
    durationFloor?: number;
    /**
     * By miliseconds
     */
    durationCeil?: number;
    /**
     * default: 0.8
     */
    scaleFloor?: number;
    /**
     * default: 1.2
     */
    scaleCeil?: number;
    /** like 100%, 50px etc. */
    range?: string;
  }> &
    BoxProps
> = ({
  children,
  durationFloor = 2000,
  durationCeil = 5000,
  scaleFloor = 0.8,
  scaleCeil = 1.2,
  range = "100%",
  style = {},
  ...rest
}) => {
  const [duration, setDuration] = useState(0);
  const [x, setX] = useState("0");
  const [y, setY] = useState("0");
  const [scale, setScale] = useState(1);

  let hook;

  const getRandomNext = () => {
    const result = range.match(/^([0-9.]+)(.*)$/);
    if (!result) {
      console.error(range);
      throw new TypeError(`range "${range}" cannot prased`);
    }

    const randomMinMax = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const [__, rangeStr, unit = "%"] = result;
    const rangeNum = parseFloat(rangeStr);
    const nextDistance = Math.random() * rangeNum;
    const nextRadius = Math.random() * Math.PI * 2;
    const nextX = Math.cos(nextRadius) * nextDistance;
    const nextY = Math.sin(nextRadius) * nextDistance;
    const nextDuration = randomMinMax(durationFloor, durationCeil);
    const nextScale = randomMinMax(scaleFloor, scaleCeil);
    return {
      nextX: `${nextX}${unit}`,
      nextY: `${nextY}${unit}`,
      nextDuration,
      nextScale,
    };
  };

  const setNextTime = () => {
    const { nextX, nextY, nextScale, nextDuration } = getRandomNext();
    setX(nextX);
    setY(nextY);
    setScale(nextScale);
    setDuration(nextDuration);
    hook = setTimeout(() => setNextTime(), nextDuration);
  };

  useLayoutEffect(() => {
    setTimeout(() => setNextTime(), 0);
    return () => {
      if (hook) {
        clearTimeout(hook);
      }
    };
  }, [durationFloor, durationCeil, range]);

  return (
    <Box
      style={{
        transform: `translate(${x}, ${y}) scale(${scale}, ${scale})`,
        transition: `all ease-in-out ${duration}ms`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
};
