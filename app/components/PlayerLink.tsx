import { Link } from "@chakra-ui/react";
import { Link as RemixLink } from "@remix-run/react";
import { Player } from "@prisma/client";

type Props = {
  player: Player;
};

export function PlayerLink({ player }: Props) {
  return (
    <Link asChild>
      <RemixLink to={`/player/${player.id}`}>
        {player.name} (#{player.id})
      </RemixLink>
    </Link>
  );
}
