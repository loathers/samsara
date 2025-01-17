import { Stack } from "@chakra-ui/react";
import { data } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Leaderboard } from "~/components/Leaderboard";
import { LeaderboardAccordion } from "~/components/LeaderboardAccordion";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { PathHeader } from "~/components/PathHeader";
import { db } from "~/db.server";
import { getPathData } from "~/path.server";
import { getExtra } from "~/utils";

export const loader = async () => {
  const path = await db.path.findFirst({
    where: { slug: "grey-goo" },
    include: { class: true },
  });

  if (!path) throw data({ message: "Invalid path name" }, { status: 400 });

  return await getPathData(path, true);
};

export const meta = () => {
  return [
    { title: `Saṃsāra - Grey Goo` },
    {
      name: "description",
      content: `Ascension stats for the Grey Goo path`,
    },
  ];
};

const getGooScore = getExtra("Goo Score");

export default function GreyGooPath() {
  const {
    frequency,
    hcSpecialLeaderboard,
    hcSpecialPyrite,
    path,
    recordBreaking,
    scSpecialLeaderboard,
    scSpecialPyrite,
    totalRuns,
    totalRunsInSeason,
  } = useLoaderData<typeof loader>();

  return (
    <Stack gap={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        recordBreaking={recordBreaking}
        extra="Goo Score"
        totalRuns={totalRuns}
        totalRunsInSeason={totalRunsInSeason}
      />
      <LeaderboardAccordion>
        <LeaderboardAccordionItem
          slug="leaderboards"
          title="Leaderboards (Goo)"
          description="The official leaderboards frozen once the path went out-of-season. This season was ranked by Goo score, rather than days and turns"
        >
          <Leaderboard
            title="Softcore Leaderboard"
            ascensions={scSpecialLeaderboard}
            alternativeScore={["Goo", getGooScore]}
          />
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={hcSpecialLeaderboard}
            alternativeScore={["Goo", getGooScore]}
          />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          slug="pyrites"
          title="Pyrites (Goo)"
          description="{PYRITE}"
        >
          <Leaderboard
            title="Softcore Leaderboard"
            ascensions={scSpecialPyrite}
            alternativeScore={["Goo", getGooScore]}
          />
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={hcSpecialPyrite}
            alternativeScore={["Goo", getGooScore]}
          />
        </LeaderboardAccordionItem>
      </LeaderboardAccordion>
    </Stack>
  );
}
