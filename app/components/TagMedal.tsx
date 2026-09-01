import { Link } from "@chakra-ui/react";
import { Tag as FullTag, Path, TagType } from "~/db";
import { Link as RRLink } from "react-router";

import { KoLImage } from "~/components/KoLImage";
import { Board, findBoard, tagHash } from "~/boards";

type Tag = Pick<FullTag, "type" | "value" | "board">;

type Props = {
  tag: Tag;
  path?: Pick<Path, "slug" | "name">;
};

function formatTag(tag: Tag, board?: Board) {
  switch (tag.type) {
    case "RECORD_BREAKING":
      return board
        ? `At time of completion, this was a record-breaking run for the ${board.label} and this lifestyle`
        : "At time of completion, this was a record-breaking run for this path and lifestyle";
    case "PERSONAL_BEST":
      return "Personal Best for path and lifestyle";
    case "LEADERBOARD":
      return board
        ? `#${tag.value} on the ${board.label} leaderboard`
        : `#${tag.value} on the official leaderboard`;
    case "LEADERBOARD_SPECIAL":
      return `#${tag.value} on the special path leaderboard`;
    case "PYRITE":
      return board
        ? `Currently #${tag.value} on the ${board.label} pyrite leaderboard`
        : `Currently #${tag.value} on the pyrite leaderboard`;
    case "PYRITE_SPECIAL":
      return `Currently #${tag.value} on the special path pyrite leaderboard`;
    case "STANDARD":
      return `#${tag.value} on the official leaderboard for ${tag.board}`;
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

export function TagMedal({ tag, path }: Props) {
  const board = path && findBoard(path.name, tag.board);

  const image = (
    <KoLImage
      src={`itemimages/${TAG_MEDAL[tag.type]}.gif`}
      alt={formatTag(tag, board)}
    />
  );

  if (!path || tag.type === "PERSONAL_BEST" || tag.type === "RECORD_BREAKING")
    return image;

  return (
    <Link asChild>
      <RRLink
        to={`/path/${path.slug}#${tagHash(path.name, tag.type, tag.board)}`}
        title={formatTag(tag, board)}
      >
        {image}
      </RRLink>
    </Link>
  );
}
