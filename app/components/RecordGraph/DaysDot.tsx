type Props = {
  days: number;
  cx: number;
  cy: number;
  r: number;
  stroke: string;
  fill: string;
  strokeWidth: number;
};

function polygon([cx, cy]: [number, number], sides: number, radius: number) {
  const slice = (2 * Math.PI) / sides;
  return Array(sides)
    .fill(slice / 2)
    .map((offset, i) => [
      cx + radius * Math.cos(offset + slice * i + Math.PI / 2),
      cy + radius * Math.sin(offset + slice * i + Math.PI / 2),
    ])
    .join(" ");
}

export function DaysDot({ days, cx, cy, r, ...rest }: Props) {
  switch (days) {
    case 2:
      return (
        <rect
          x={cx - r / 3}
          y={cy - r}
          width={r / 1.5}
          height={r * 2}
          {...rest}
        />
      );
    case 1:
      return <circle cx={cx} cy={cy} r={r} {...rest} />;
    default:
      return <polygon points={polygon([cx, cy], days, r)} {...rest} />;
  }
}
