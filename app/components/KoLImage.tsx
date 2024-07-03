import { Image } from "@chakra-ui/react";

export function KoLImage({ src, alt }: { src: string; alt?: string }) {
  return (
    <Image
      src={`https://s3.amazonaws.com/images.kingdomofloathing.com/${src}`}
      alt={alt}
    />
  );
}
