import { KoLImage } from "~/components/KoLImage";

type Props = {
  path: { name: string; image: string | null };
  title?: string;
};

function formatImage(path: Props["path"]) {
  // If a path other than "None" has no image, the data just isn't in Data of Loathing yet - it must be a new path!
  if (!path.image) return path.name === "None" ? "blank" : "bigqmark";
  if (path.image === "oxy") return "smalloxy";
  return path.image;
}

export function PathIcon({ path, title }: Props) {
  const image = formatImage(path);

  return (
    <KoLImage src={`itemimages/${image}.gif`} alt={path.name} title={title} />
  );
}
