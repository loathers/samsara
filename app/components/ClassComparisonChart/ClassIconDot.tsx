type Props = {
  class: { name: string; image: string | null };
  invert?: boolean;
  cx?: number;
  cy?: number;
  size?: number;
};

/** Mirrors KoLImage as a raw SVG <image>, since a Chakra Image cannot render inside the chart. */
export function ClassIconDot({
  class: clazz,
  invert = false,
  cx,
  cy,
  size = 20,
}: Props) {
  if (cx === undefined || cy === undefined) return null;

  // No image means Data of Loathing has not caught up with a new class yet.
  const image = clazz.image ?? "bigqmark";

  return (
    <image
      href={`https://s3.amazonaws.com/images.kingdomofloathing.com/itemimages/${image}.gif`}
      x={cx - size / 2}
      y={cy - size / 2}
      width={size}
      height={size}
      filter={invert ? "invert(1)" : undefined}
    >
      <title>{clazz.name}</title>
    </image>
  );
}
