import { Box, Flex } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

type Props = {
  value: number;
  lineHeight?: number;
  duration?: number;
};

function Numbers({ index, lineHeight }: { index: number; lineHeight: number }) {
  return Array.from({ length: 11 }, (_, i) => (
    <Box
      height={`${lineHeight}px`}
      key={i}
      px={1}
      borderLeft={index > 0 ? `1px solid black` : undefined}
    >
      {i % 10}
    </Box>
  )).reverse();
}

export function Counter({ value, lineHeight = 35, duration = 1 }: Props) {
  const scrollDigits = (lineHeight: number) => keyframes`
    0% {
      transform: translateY(-${lineHeight * 10}px);
    }
    10% {
      transform: translateY(-${lineHeight * 9}px);
    }
    20% {
      transform: translateY(-${lineHeight * 8}px);
    }
    30% {
      transform: translateY(-${lineHeight * 7}px);
    }
    40% {
      transform: translateY(-${lineHeight * 6}px);
    }
    50% {
      transform: translateY(-${lineHeight * 5}px);
    }
    60% {
      transform: translateY(-${lineHeight * 4}px);
    }
    70% {
      transform: translateY(-${lineHeight * 3}px);
    }
    80% {
      transform: translateY(-${lineHeight * 2}px);
    }
    90% {
      transform: translateY(-${lineHeight * 1}px);
    }
    100% {
      transform: translateY(0%);
    }
  `;

  const length = Math.floor(Math.log10(value) + 1);

  return (
    <Box>
      <Flex
        display="inline-flex"
        direction="row"
        overflow="hidden"
        border="1px solid black"
        height={`${lineHeight}px`}
        lineHeight={`${lineHeight}px`}
        justifyContent="center"
        mixBlendMode="luminosity"
      >
        {[...Array(length).keys()].map((i) => {
          const iterations = Math.floor(value / 10 ** (length - i - 1)) / 10;
          const unitDuration = duration / iterations;
          return (
            <Box
              margin={0}
              p={0}
              fontFamily="monospace"
              fontSize={`${lineHeight}px`}
              key={i}
              css={{
                animationName: `${scrollDigits(lineHeight)}`,
                animationTimingFunction: "ease-in-out",
                animationDuration: `${unitDuration}s`,
                animationFillMode: "forwards",
                animationIterationCount: iterations,
                "&:first-of-type li": { borderLeft: "none" },
              }}
            >
              <Numbers index={i} lineHeight={lineHeight} />
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
}
