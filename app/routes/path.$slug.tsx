import { Accordion, Stack } from "@chakra-ui/react";
import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useMemo } from "react";

import { Leaderboard } from "~/components/Leaderboard";
import { db } from "~/db.server";
import { formatPathName } from "~/utils";
import { PathHeader } from "~/components/PathHeader";
import { getLeaderboard } from "~/utils.server";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { slug } = params;
  const path = await db.path.findFirst({ where: { slug } });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  const isSeasonal = ![
    "None",
    "Oxygenarian",
    "Boozetafarian",
    "Teetotaller",
    "Standard",
    "Bad Moon",
  ].includes(path.name);

  if (!isSeasonal) {
    path.start = new Date(new Date().getFullYear(), 0, 1);
    path.end = new Date(new Date().getFullYear() + 1, 11, 31);
  }

  const isCurrent = !!path.end && new Date() < path.end;

  const bestHCEver = await getLeaderboard(path.name, "HARDCORE");
  const bestSCEver = await getLeaderboard(path.name, "SOFTCORE");
  const bestHCInSeason = path.end
    ? await getLeaderboard(path.name, "HARDCORE", undefined, path.end)
    : null;
  const bestSCInSeason = path.end
    ? await getLeaderboard(path.name, "SOFTCORE", undefined, path.end)
    : null;

  const daysSinceStart =
    (new Date().getTime() - (path.start?.getTime() ?? 0)) / (1000 * 3600 * 24);
  const stats = await db.ascension.getStats(
    undefined,
    path.name,
    daysSinceStart < 90 ? "week" : "month",
  );

  return json({
    path,
    stats,
    isCurrent,
    isSeasonal,
    bestHCEver,
    bestSCEver,
    bestHCInSeason,
    bestSCInSeason,
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
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
    isSeasonal,
    stats,
    bestHCInSeason,
    bestHCEver,
    bestSCEver,
    bestSCInSeason,
  } = useLoaderData<typeof loader>();

  const scLeaderboard = useMemo(
    () => bestSCInSeason?.map((a) => ({ ...a, date: new Date(a.date) })),
    [bestSCInSeason],
  );
  const hcLeaderboard = useMemo(
    () => bestHCInSeason?.map((a) => ({ ...a, date: new Date(a.date) })),
    [bestHCInSeason],
  );
  const scPyrites = useMemo(
    () => bestSCEver.map((a) => ({ ...a, date: new Date(a.date) })),
    [bestSCEver],
  );
  const hcPyrites = useMemo(
    () => bestHCEver.map((a) => ({ ...a, date: new Date(a.date) })),
    [bestHCEver],
  );

  return (
    <Stack spacing={10}>
      <PathHeader path={path} stats={stats} isSeasonal={isSeasonal} />
      <Accordion allowToggle>
        {scLeaderboard && hcLeaderboard && (
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
              ascensions={scLeaderboard}
            />
            <Leaderboard
              title="Hardcore Leaderboard"
              ascensions={hcLeaderboard}
            />
          </LeaderboardAccordionItem>
        )}
        {!isCurrent && (
          <LeaderboardAccordionItem title="Pyrites" description="{PYRITE}">
            <Leaderboard title="Softcore Pyrites" ascensions={scPyrites} />
            <Leaderboard title="Hardcore Pyrites" ascensions={hcPyrites} />
          </LeaderboardAccordionItem>
        )}
      </Accordion>
    </Stack>
  );
}
