import { Link } from "@chakra-ui/react";
import { Link as RemixLink } from "@remix-run/react";

import { FormattedDate } from "./FormattedDate";

type Props = {
  ascension: { date: Date; player: { id: number }; ascensionNumber: number };
};

export function AscensionDate({ ascension }: Props) {
  return (
    <Link asChild>
      <RemixLink
        to={`/player/${ascension.player.id}#${ascension.ascensionNumber}`}
      >
        <FormattedDate date={ascension.date} />
      </RemixLink>
    </Link>
  );
}
