import { Accordion, Stack } from "@chakra-ui/react";
import { json, unstable_defineLoader as defineLoader } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { Leaderboard } from "~/components/Leaderboard";
import { db } from "~/db.server";
import { PathHeader } from "~/components/PathHeader";
import { getLeaderboard } from "~/utils.server";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";

export const loader = defineLoader(async () => {
  const path = await db.path.findFirst({ where: { slug: "bad-moon" } });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  const bestHCEver = await getLeaderboard(path, "HARDCORE");
  const bestSCEver = await getLeaderboard(path, "SOFTCORE");
  const bestCasualEver = await getLeaderboard(path, "CASUAL");

  const stats = await db.ascension.getStats(undefined, path.name);

  return {
    path,
    stats,
    bestHCEver,
    bestSCEver,
    bestCasualEver,
  };
});

export const meta = () => {
  return [
    { title: `Saṃsāra ♻️ - Bad Moon` },
    {
      name: "description",
      content: `Ascension stats for the Bad Moon path(? sign?)`,
    },
  ];
};

export default function Path() {
  const { path, stats, bestHCEver, bestSCEver, bestCasualEver } =
    useLoaderData<typeof loader>();

  return (
    <Stack spacing={10}>
      <PathHeader path={path} stats={stats} />
      <Accordion allowToggle>
        <LeaderboardAccordionItem
          title="Leaderboard"
          description="The official leaderboard as it currently stands"
        >
          <Leaderboard ascensions={bestHCEver} />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          title="Weird leaderboards"
          description="Some curious folks managed to run the path outside of Hardcore and we must respect their work."
        >
          <Leaderboard title="Softcore Leaderboard?" ascensions={bestSCEver} />
          <Leaderboard
            title="Casual? Leaderboard??"
            ascensions={bestCasualEver}
          />
        </LeaderboardAccordionItem>
      </Accordion>
    </Stack>
  );
}
