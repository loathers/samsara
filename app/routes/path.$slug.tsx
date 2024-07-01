import { Accordion, Stack } from "@chakra-ui/react";
import { json, unstable_defineLoader as defineLoader } from "@remix-run/node";
import { MetaArgs_SingleFetch, useLoaderData } from "@remix-run/react";

import { Leaderboard } from "~/components/Leaderboard";
import { db } from "~/db.server";
import { formatPathName } from "~/utils";
import { PathHeader } from "~/components/PathHeader";
import { getLeaderboard } from "~/utils.server";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";

export const loader = defineLoader(async ({ params }) => {
  const { slug } = params;
  const path = await db.path.findFirst({ where: { slug } });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  if (!path.seasonal) {
    path.start = new Date(new Date().getFullYear(), 0, 1);
    path.end = new Date(new Date().getFullYear() + 1, 11, 31);
  }

  const isCurrent = !!path.end && new Date() < path.end;

  const bestHCEver = await getLeaderboard(path.name, "HARDCORE");
  const bestSCEver = await getLeaderboard(path.name, "SOFTCORE");
  const bestHCInSeason = path.end
    ? await getLeaderboard(path.name, "HARDCORE", undefined, path.end)
    : [];
  const bestSCInSeason = path.end
    ? await getLeaderboard(path.name, "SOFTCORE", undefined, path.end)
    : [];

  const daysSinceStart =
    (new Date().getTime() - (path.start?.getTime() ?? 0)) / (1000 * 3600 * 24);
  const stats = await db.ascension.getStats(
    undefined,
    path.name,
    daysSinceStart < 90 ? "week" : "month",
  );

  return {
    path,
    stats,
    isCurrent,
    bestHCEver,
    bestSCEver,
    bestHCInSeason,
    bestSCInSeason,
  };
});

export const meta = ({ data }: MetaArgs_SingleFetch<typeof loader>) => {
  return [
    { title: `Saṃsāra ♻️ - ${formatPathName(data?.path.name ?? "Unknown")}` },
    {
      name: "description",
      content: `Ascension stats for the ${data?.path.name ?? "Unknown"} path`,
    },
  ];
};

export default function Path() {
  const {
    path,
    isCurrent,
    stats,
    bestHCInSeason,
    bestHCEver,
    bestSCEver,
    bestSCInSeason,
  } = useLoaderData<typeof loader>();

  return (
    <Stack spacing={10}>
      <PathHeader path={path} stats={stats} />
      <Accordion allowToggle>
        {bestSCInSeason.length + bestHCInSeason.length > 0 && (
          <LeaderboardAccordionItem
            title="Leaderboards"
            description={
              isCurrent
                ? "The official leaderboards as they currently stand"
                : "The official leaderboards frozen once the path went out-of-season"
            }
          >
            <Leaderboard
              title="Softcore Leaderboard"
              ascensions={bestSCInSeason}
            />
            <Leaderboard
              title="Hardcore Leaderboard"
              ascensions={bestHCInSeason}
            />
          </LeaderboardAccordionItem>
        )}
        {!isCurrent && (
          <LeaderboardAccordionItem title="Pyrites" description="{PYRITE}">
            <Leaderboard title="Softcore Pyrites" ascensions={bestSCEver} />
            <Leaderboard title="Hardcore Pyrites" ascensions={bestHCEver} />
          </LeaderboardAccordionItem>
        )}
      </Accordion>
    </Stack>
  );
}
