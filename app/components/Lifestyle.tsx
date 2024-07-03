import { Lifestyle as LifestyleEnum } from "@prisma/client";
import { ShortenStyle } from "~/utils";
import { KoLImage } from "./KoLImage";

type Props = {
  lifestyle: LifestyleEnum;
  shorten?: ShortenStyle;
};

const LIFESTYLE_FORMATS = {
  HARDCORE: {
    full: "Hardcore",
    acronyms: "HC",
    symbols: "hardcorex",
  },
  SOFTCORE: {
    full: "Softcore",
    acronyms: "SC",
    symbols: "blank",
  },
  CASUAL: {
    full: "Casual",
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
  if (shorten === "symbols") {
    const image = LIFESTYLE_FORMATS[lifestyle].symbols;
    return (
      <KoLImage
        src={`itemimages/${image}.gif`}
        alt={LIFESTYLE_FORMATS[lifestyle].full}
      />
    );
  }

  return formatLifestyle(lifestyle, shorten);
}
