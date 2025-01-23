import { Link } from "@chakra-ui/react";
import { Player } from "@prisma/client";
import { Link as RRLink } from "react-router";

type Props = {
  player: Player;
};

export function PlayerLink({ player }: Props) {
  return (
    <Link asChild>
      <RRLink to={`/player/${player.id}`}>
        {player.name} (#{player.id})
      </RRLink>
    </Link>
  );
}
