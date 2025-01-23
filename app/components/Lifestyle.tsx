import { HStack } from "@chakra-ui/react";
import { Lifestyle as LifestyleEnum } from "@prisma/client";

import { KoLImage } from "~/components/KoLImage";
import { ShortenStyle } from "~/utils";

type Props = {
  lifestyle: LifestyleEnum;
  shorten?: ShortenStyle;
};

const LIFESTYLE_FORMATS = {
  HARDCORE: {
    full: "Hardcore",
    "full-symbols": "Hardcore",
    acronyms: "HC",
    symbols: "hardcorex",
  },
  SOFTCORE: {
    full: "Softcore",
    "full-symbols": "Softcore",
    acronyms: "SC",
    symbols: "blank",
  },
  CASUAL: {
    full: "Casual",
    "full-symbols": "Casual",
    acronyms: "C",
    symbols: "beanbag",
  },
};

export function formatLifestyle(
  lifestyle: LifestyleEnum,
  shorten?: ShortenStyle,
) {
  return LIFESTYLE_FORMATS[lifestyle][shorten ?? "full"];
}

export function Lifestyle({ lifestyle, shorten }: Props) {
  const imageElement = (
    <KoLImage
      src={`itemimages/${LIFESTYLE_FORMATS[lifestyle].symbols}.gif`}
      alt={LIFESTYLE_FORMATS[lifestyle].full}
    />
  );

  switch (shorten) {
    case "symbols":
      return imageElement;
    case "full-symbols":
      return (
        <HStack minWidth={15} gap={1}>
          {imageElement}
          {formatLifestyle(lifestyle, shorten)}
        </HStack>
      );
    default:
      return formatLifestyle(lifestyle, shorten);
  }
}
