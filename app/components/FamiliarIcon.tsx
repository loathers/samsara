import { Familiar } from "@prisma/client";

import { KoLImage } from "~/components/KoLImage";

type Props = {
  familiar: Familiar | null;
};

export function FamiliarIcon({ familiar }: Props) {
  return (
    <KoLImage
      src={`itemimages/${familiar?.image ?? "blank"}.gif`}
      alt={`${familiar?.name ?? "None"}${familiar?.image === "nopic" ? ` (waiting to observe the icon)` : ""}`}
    />
  );
}
