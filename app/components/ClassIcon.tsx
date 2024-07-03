import { KoLImage } from "./KoLImage";

type Props = {
  class: { name: string; image: string | null };
};

function formatImage(clazz: Props["class"]) {
  // If a path has no image, the data just isn't in Data of Loathing yet - it must be a new class!
  if (!clazz.image) return "bigqmark";
  return clazz.image;
}

export function ClassIcon({ class: clazz }: Props) {
  const image = formatImage(clazz);

  return <KoLImage src={`itemimages/${image}.gif`} alt={clazz.name} />;
}
