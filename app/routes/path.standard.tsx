import { Stack } from "@chakra-ui/react";
import { useMemo } from "react";
import { data, useLoaderData } from "react-router";

import { ClassComparisonChart } from "~/components/ClassComparisonChart/ClassComparisonChart";
import { Dedication } from "~/components/Dedication";
import { Leaderboard } from "~/components/Leaderboard";
import { LeaderboardAccordion } from "~/components/LeaderboardAccordion";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { PathHeader } from "~/components/PathHeader";
import { findPathWithClasses } from "~/db.server";
import {
  getPastStandardLeaderboards,
  getPathData,
  getStandardClassComparison,
} from "~/path.server";

export const loader = async () => {
  const path = await findPathWithClasses({ slug: "standard" });

  if (!path) throw data({ message: "Invalid path name" }, { status: 400 });

  const [pathData, years, classes] = await Promise.all([
    getPathData(path),
    getPastStandardLeaderboards(path),
    getStandardClassComparison(path),
  ]);

  return { ...pathData, years, classComparison: classes };
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
    classComparison,
    frequency,
    path,
    totalRuns,
    years,
    boards,
  } = useLoaderData<typeof loader>();

  const {
    classes,
    hcDedication,
    hcLeaderboard,
    hcPyrite,
    hcRecent,
    scDedication,
    scLeaderboard,
    scPyrite,
    scRecent,
  } = boards[0];

  const yearBoards = useMemo(
    () =>
      Object.entries(years)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([year, { softcore, hardcore }]) => (
          <LeaderboardAccordionItem
            key={year}
            title={`${year} Leaderboards`}
            slug={year}
            description="The official leaderboards frozen from the end of the year"
          >
            <Leaderboard
              title="Softcore Leaderboard"
              ascensions={softcore}
              showClass
            >
              <ClassComparisonChart
                data={classComparison[Number(year)]?.softcore ?? []}
              />
            </Leaderboard>
            <Leaderboard
              title="Hardcore Leaderboard"
              ascensions={hardcore}
              showClass
            >
              <ClassComparisonChart
                data={classComparison[Number(year)]?.hardcore ?? []}
              />
            </Leaderboard>
          </LeaderboardAccordionItem>
        )),
    [years, classComparison],
  );

  return (
    <Stack gap={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        boards={boards}
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
          >
            <ClassComparisonChart
              data={classes.main.softcore}
            />
          </Leaderboard>
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={hcLeaderboard}
            showClass
          >
            <ClassComparisonChart
              data={classes.main.hardcore}
            />
          </Leaderboard>
        </LeaderboardAccordionItem>
        {yearBoards}
        <LeaderboardAccordionItem title="Pyrites" description="{PYRITE}">
          <Leaderboard
            title="Softcore Pyrites"
            ascensions={scPyrite}
            showClass
          >
            <ClassComparisonChart
              data={classes.pyrite.softcore}
            />
          </Leaderboard>
          <Leaderboard
            title="Hardcore Pyrites"
            ascensions={hcPyrite}
            showClass
          >
            <ClassComparisonChart
              data={classes.pyrite.hardcore}
            />
          </Leaderboard>
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          slug="recent"
          title="Recent Ascensions"
          description="The most recent ascensions on this path"
        >
          <Leaderboard
            title="Softcore"
            ascensions={scRecent}
            ranked={false}
            showClass
          />
          <Leaderboard
            title="Hardcore"
            ascensions={hcRecent}
            ranked={false}
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
