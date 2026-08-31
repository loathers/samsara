import { Image } from "@chakra-ui/react";

export const KOL_IMAGE_BASE = "https://s3.amazonaws.com/images.kingdomofloathing.com";

export function KoLImage({
  src,
  alt,
  title,
}: {
  src: string;
  alt?: string;
  title?: string;
}) {
  return (
    <Image
      src={`${KOL_IMAGE_BASE}/${src}`}
      filter={{ _dark: "invert(1)" }}
      alt={alt}
      title={title ?? alt}
    />
  );
}
