import { Link } from "@chakra-ui/react";
import { Link as RemixLink } from "@remix-run/react";

import { FormattedDate } from "./FormattedDate";

type Props = {
  ascension: { date: string; player: { id: number }; ascensionNumber: number };
};

export function AscensionDate({ ascension }: Props) {
  return (
    <Link
      as={RemixLink}
      to={`/player/${ascension.player.id}#${ascension.ascensionNumber}`}
    >
      <FormattedDate date={ascension.date} />
    </Link>
  );
}
