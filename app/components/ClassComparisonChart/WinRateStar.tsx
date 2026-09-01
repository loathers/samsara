type Props = {
  cx?: number;
  cy?: number;
  fill: string;
  /** Inverse of the fill, so the star reads where it overlaps a bar. */
  stroke: string;
};

const SIZE = 13;

function starPoints(outer: number, inner: number) {
  const step = Math.PI / 5;
  return [...Array(10).keys()]
    .map((i) => {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = i * step - Math.PI / 2;
      return `${radius * Math.cos(angle)},${radius * Math.sin(angle)}`;
    })
    .join(" ");
}

// The shape never changes, only where it sits.
const POINTS = starPoints(SIZE / 2, SIZE / 5);

export function WinRateStar({ cx, cy, fill, stroke }: Props) {
  if (cx === undefined || cy === undefined) return null;

  return (
    <polygon
      points={POINTS}
      transform={`translate(${cx},${cy})`}
      fill={fill}
      stroke={stroke}
      strokeWidth={0.5}
      strokeLinejoin="round"
    />
  );
}
