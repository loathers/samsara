import { Icon } from "@chakra-ui/react";

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
  const angle = (2 * Math.PI) / sides;
  return [...Array(sides).keys()]
    .map((i) => [
      cx + radius * Math.sin(angle * i),
      cy + radius * -Math.cos(angle * i),
    ])
    .join(" ");
}

export function DaysDot({ days, cx, cy, r, ...rest }: Props) {
  switch (days) {
    case 2:
      return (
        <Icon color="bg">
          <rect
            x={cx - r / 3}
            y={cy - r}
            width={r / 1.5}
            height={r * 2}
            {...rest}
            fill="currentColor"
          />
        </Icon>
      );
    case 1:
      return (
        <Icon color="bg">
          <circle cx={cx} cy={cy} r={r} {...rest} fill="currentColor" />
        </Icon>
      );
    default:
      return (
        <Icon color="bg">
          <polygon
            points={polygon([cx, cy], days, r)}
            {...rest}
            fill="currentColor"
          />
        </Icon>
      );
  }
}
