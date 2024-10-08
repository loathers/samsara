import { Tag as FullTag, Path, TagType } from "@prisma/client";
import { KoLImage } from "./KoLImage";
import { Link } from "@chakra-ui/react";
import { Link as RemixLink } from "@remix-run/react";

type Tag = Pick<FullTag, "type" | "value">;

type Props = {
  tag: Tag;
  path?: Pick<Path, "slug">;
};

function formatTag(tag: Tag) {
  switch (tag.type) {
    case "RECORD_BREAKING":
      return "At time of completion, this was a record-breaking run for this path and lifestyle";
    case "PERSONAL_BEST":
      return "Personal Best for path and lifestyle";
    case "LEADERBOARD":
      return `Currently #${tag.value} on the official leaderboard`;
    case "LEADERBOARD_SPECIAL":
      return `Currently #${tag.value} on the special path leaderboard`;
    case "PYRITE":
      return `Currently #${tag.value} on the pyrite leaderboard`;
    case "PYRITE_SPECIAL":
      return `Currently #${tag.value} on the special path pyrite leaderboard`;
    default:
      return tag.type;
  }
}

const TAG_MEDAL: Record<TagType, string> = {
  RECORD_BREAKING: "wossname",
  PERSONAL_BEST: "hmedheart",
  LEADERBOARD: "hmedstar",
  LEADERBOARD_SPECIAL: "hmedstar",
  PYRITE: "fdkol_medal",
  PYRITE_SPECIAL: "fdkol_medal",
};

export function TagMedal({ tag, path }: Props) {
  const image = (
    <KoLImage
      src={`itemimages/${TAG_MEDAL[tag.type]}.gif`}
      alt={formatTag(tag)}
    />
  );

  if (!path || tag.type === "PERSONAL_BEST" || tag.type === "RECORD_BREAKING")
    return image;

  const hash = tag.type.startsWith("LEADERBOARD") ? "leaderboards" : "pyrites";
  return (
    <Link
      as={RemixLink}
      to={`/path/${path.slug}#${hash}`}
      title={formatTag(tag)}
    >
      {image}
    </Link>
  );
}
