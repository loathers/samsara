import { Box, Flex } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useState } from "react";

import { numberFormatter } from "~/utils";

type Props = {
  value: number;
  lineHeight?: number;
  spinUpSeconds?: number;
};

const DIGITS = 10;

// Each column is a strip of 0,9,8...1,0 scrolled by one CSS animation, the
// extra cell being the zero it wraps to. A fractional animation-iteration-count
// parks a column on any digit, and a negative delay starts it partway along.
const CELLS = DIGITS + 1;

const STEP_SECONDS = 0.12;

function scrollDigits(lineHeight: number) {
  return keyframes(
    Array.from(
      { length: CELLS },
      (_, i) =>
        `${(i / DIGITS) * 100}% { transform: translateY(-${lineHeight * (DIGITS - i)}px); }`,
    ).join("\n"),
  );
}

const restAt = (digit: number, lineHeight: number) => ({
  transform: `translateY(-${(DIGITS - digit) * lineHeight}px)`,
});

type Animation = { iterations: number; cycleDuration: number; delay: number };

function windUp(
  value: number,
  length: number,
  index: number,
  spinUpSeconds: number,
): Animation | null {
  const iterations =
    Math.floor(value / DIGITS ** (length - index - 1)) / DIGITS;
  if (iterations === 0) return null;
  return { iterations, cycleDuration: spinUpSeconds / iterations, delay: 0 };
}

function rollTo(from: number, to: number): Animation | null {
  const steps = (to - from + DIGITS) % DIGITS;
  if (steps === 0) return null;
  return {
    iterations: (from + steps) / DIGITS,
    cycleDuration: STEP_SECONDS * DIGITS,
    delay: -from * STEP_SECONDS,
  };
}

function Numbers({ index, lineHeight }: { index: number; lineHeight: number }) {
  return Array.from({ length: CELLS }, (_, i) => (
    <Box
      height={`${lineHeight}px`}
      key={i}
      px={1}
      borderLeftWidth="1px"
      borderLeftStyle={index > 0 ? "solid" : "none"}
      borderLeftColor="fg"
    >
      {i % 10}
    </Box>
  )).reverse();
}

export function Counter({ value, lineHeight = 35, spinUpSeconds = 1 }: Props) {
  // NaN would re-trigger the update forever.
  const total = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;

  const [roll, setRoll] = useState({ from: null as number | null, to: total });

  // Adjusting during render puts the roll in the markup React paints.
  if (roll.to !== total) {
    setRoll((state) => ({ from: state.to, to: total }));
  }

  const digits = String(total).split("").map(Number);
  const { length } = digits;

  // A different column count misaligns every strip.
  const previous =
    roll.from !== null && String(roll.from).length === length
      ? String(roll.from).split("").map(Number)
      : null;

  return (
    <Box position="relative">
      <Box srOnly>{numberFormatter.format(total)}</Box>
      <Flex
        aria-hidden="true"
        display="inline-flex"
        direction="row"
        overflow="hidden"
        borderWidth="1px"
        borderStyle="solid"
        borderColor="fg"
        height={`${lineHeight}px`}
        lineHeight={`${lineHeight}px`}
        justifyContent="center"
        mixBlendMode="luminosity"
      >
        {digits.map((digit, i) => {
          const animation = previous
            ? rollTo(previous[i], digit)
            : windUp(total, length, i, spinUpSeconds);

          const rest = restAt(digit, lineHeight);

          return (
            <Box
              key={`${i}-${digit}`}
              margin={0}
              p={0}
              fontFamily="monospace"
              fontSize={`${lineHeight}px`}
              css={
                animation
                  ? {
                      animationName: `${scrollDigits(lineHeight)}`,
                      animationTimingFunction: "ease-in-out",
                      animationDuration: `${animation.cycleDuration}s`,
                      animationDelay: `${animation.delay}s`,
                      animationIterationCount: animation.iterations,
                      animationFillMode: "both",
                      "@media (prefers-reduced-motion: reduce)": {
                        animationName: "none",
                        ...rest,
                      },
                    }
                  : rest
              }
            >
              <Numbers index={i} lineHeight={lineHeight} />
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
}
