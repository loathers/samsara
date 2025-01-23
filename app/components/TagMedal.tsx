import { Link } from "@chakra-ui/react";
import { Tag as FullTag, Path, TagType } from "@prisma/client";
import { Link as RRLink } from "react-router";

import { KoLImage } from "~/components/KoLImage";

type Tag = Pick<FullTag, "type" | "value" | "year">;

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
      return `#${tag.value} on the official leaderboard`;
    case "LEADERBOARD_SPECIAL":
      return `#${tag.value} on the special path leaderboard`;
    case "PYRITE":
      return `Currently #${tag.value} on the pyrite leaderboard`;
    case "PYRITE_SPECIAL":
      return `Currently #${tag.value} on the special path pyrite leaderboard`;
    case "STANDARD":
      return `#${tag.value} on the official leaderboard for ${tag.year}`;
    default:
      return tag.type;
  }
}

const TAG_MEDAL: Record<TagType, string> = {
  RECORD_BREAKING: "wossname",
  PERSONAL_BEST: "hmedheart",
  LEADERBOARD: "hmedstar",
  LEADERBOARD_SPECIAL: "hmedstar",
  STANDARD: "hmedstar",
  PYRITE: "fdkol_medal",
  PYRITE_SPECIAL: "fdkol_medal",
};

function getHash(tag: Tag) {
  if (tag.type.startsWith("LEADERBOARD")) return "leaderboards";
  if (tag.type === "STANDARD") return tag.year;
  return "pyrites";
}

export function TagMedal({ tag, path }: Props) {
  const image = (
    <KoLImage
      src={`itemimages/${TAG_MEDAL[tag.type]}.gif`}
      alt={formatTag(tag)}
    />
  );

  if (!path || tag.type === "PERSONAL_BEST" || tag.type === "RECORD_BREAKING")
    return image;

  return (
    <Link asChild>
      <RRLink to={`/path/${path.slug}#${getHash(tag)}`} title={formatTag(tag)}>
        {image}
      </RRLink>
    </Link>
  );
}
