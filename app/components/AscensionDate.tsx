import { Link } from "@chakra-ui/react";
import { Link as RRLink } from "react-router";

import { FormattedDate } from "~/components/FormattedDate";

type Props = {
  ascension: { date: Date; player: { id: number }; ascensionNumber: number };
};

export function AscensionDate({ ascension }: Props) {
  return (
    <Link asChild>
      <RRLink
        to={`/player/${ascension.player.id}#${ascension.ascensionNumber}`}
      >
        <FormattedDate date={ascension.date} />
      </RRLink>
    </Link>
  );
}
