import { classImageSrc } from "~/components/ClassIcon";
import { KOL_IMAGE_BASE } from "~/components/KoLImage";

const SIZE = 20;

type Props = {
  class: { name: string; image: string | null };
  invert?: boolean;
  cx?: number;
  cy?: number;
};

/** KoLImage renders an <img>, which is invalid inside the chart's <svg>. */
export function ClassIconDot({ class: clazz, invert = false, cx, cy }: Props) {
  if (cx === undefined || cy === undefined) return null;

  return (
    <image
      href={`${KOL_IMAGE_BASE}/${classImageSrc(clazz)}`}
      x={cx - SIZE / 2}
      y={cy - SIZE / 2}
      width={SIZE}
      height={SIZE}
      filter={invert ? "invert(1)" : undefined}
    >
      <title>{clazz.name}</title>
    </image>
  );
}
