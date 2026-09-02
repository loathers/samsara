import { Link } from "@chakra-ui/react";
import { Tag as FullTag, Lifestyle, Path, TagType } from "~/db";
import { Link as RRLink } from "react-router";

import { KoLImage } from "~/components/KoLImage";
import { Board, findBoard, tagHash } from "~/boards";

type Tag = Pick<FullTag, "type" | "value" | "board">;

type Props = {
  tag: Tag;
  lifestyle: Lifestyle;
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
    case "PYRITE":
      return board
        ? `Currently #${tag.value} on the ${board.label} pyrite leaderboard`
        : `Currently #${tag.value} on the pyrite leaderboard`;
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

export function TagMedal({ tag, lifestyle, path }: Props) {
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
        to={`/path/${path.slug}#${tagHash(path.name, tag.type, tag.board, lifestyle)}`}
        title={formatTag(tag, board)}
      >
        {image}
      </RRLink>
    </Link>
  );
}
