import { Tag, TagType } from "@prisma/client";
import { KoLImage } from "./KoLImage";

type Props = {
  tag: Tag;
};

function formatTag(tag: Tag) {
  switch (tag.type) {
    case "RECORD_BREAKING":
      return "At time of completion, this was a record-breaking run for this path and lifestyle";
    case "PERSONAL_BEST":
      return "Personal Best for path and lifestyle";
    case "LEADERBOARD":
      return `Currently #${tag.value} on the official leaderboard`;
    case "PYRITE":
      return `Currently #${tag.value} on the pyrite leaderboard`;
    default:
      return tag.type;
  }
}

const TAG_MEDAL: Record<TagType, string> = {
  RECORD_BREAKING: "wossname",
  PERSONAL_BEST: "hmedheart",
  LEADERBOARD: "hmedstar",
  PYRITE: "fdkol_medal",
};

export function TagMedal({ tag }: Props) {
  return (
    <KoLImage
      src={`itemimages/${TAG_MEDAL[tag.type]}.gif`}
      alt={formatTag(tag)}
    />
  );
}