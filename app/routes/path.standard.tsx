import { Stack } from "@chakra-ui/react";
import { data } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { Leaderboard } from "~/components/Leaderboard";
import { PathHeader } from "~/components/PathHeader";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { Dedication } from "~/components/Dedication";
import { db } from "~/db.server";
import { getPastStandardLeaderboards, getPathData } from "~/path.server";
import { LeaderboardAccordion } from "~/components/LeaderboardAccordion";
import { useMemo } from "react";

export const loader = async () => {
  const path = await db.path.findFirst({
    where: { slug: "standard" },
    include: { class: true },
  });

  if (!path) throw data({ message: "Invalid path name" }, { status: 400 });

  return {
    ...(await getPathData(path)),
    years: await getPastStandardLeaderboards(path),
  };
};

export const meta = () => {
  return [
    { title: `Saṃsāra - Standard` },
    {
      name: "description",
      content: `Ascension stats for the Standard path`,
    },
  ];
};

export default function PathPage() {
  const {
    frequency,
    hcDedication,
    hcLeaderboard,
    hcPyrite,
    path,
    recordBreaking,
    scDedication,
    scLeaderboard,
    scPyrite,
    years,
    totalRuns,
  } = useLoaderData<typeof loader>();

  const yearBoards = useMemo(
    () =>
      Object.entries(years)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([year, { softcore, hardcore }]) => (
          <LeaderboardAccordionItem
            title={`${year} Leaderboards`}
            slug={year}
            description="The official leaderboards frozen from the end of the year"
          >
            <Leaderboard
              title="Softcore Leaderboard"
              ascensions={softcore}
              showClass
            />
            <Leaderboard
              title="Hardcore Leaderboard"
              ascensions={hardcore}
              showClass
            />
          </LeaderboardAccordionItem>
        )),
    [years],
  );

  return (
    <Stack gap={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        recordBreaking={recordBreaking}
        totalRuns={totalRuns}
      />
      <LeaderboardAccordion>
        <LeaderboardAccordionItem
          title="Leaderboards"
          description="This year's official leaderboards as they currently stand"
        >
          <Leaderboard
            title="Softcore Leaderboard"
            ascensions={scLeaderboard}
            showClass
          />
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={hcLeaderboard}
            showClass
          />
        </LeaderboardAccordionItem>
        {yearBoards}
        <LeaderboardAccordionItem title="Pyrites" description="{PYRITE}">
          <Leaderboard
            title="Softcore Pyrites"
            ascensions={scPyrite}
            showClass
          />
          <Leaderboard
            title="Hardcore Pyrites"
            ascensions={hcPyrite}
            showClass
          />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          title="Dedication"
          description="Players who have completed the most ascensions for this path"
        >
          <Dedication title="Softcore Dedication" dedication={scDedication} />
          <Dedication title="Hardcore Dedication" dedication={hcDedication} />
        </LeaderboardAccordionItem>
      </LeaderboardAccordion>
    </Stack>
  );
}
