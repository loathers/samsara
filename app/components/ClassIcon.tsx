import { KoLImage } from "~/components/KoLImage";

type Props = {
  class: { name: string; image: string | null };
};

export function classImageSrc(clazz: Props["class"]) {
  // If a class has no image, the data just isn't in Data of Loathing yet - it must be new!
  return `itemimages/${clazz.image ?? "bigqmark"}.gif`;
}

export function ClassIcon({ class: clazz }: Props) {
  return <KoLImage src={classImageSrc(clazz)} alt={clazz.name} />;
}
