import { Accordion, Stack } from "@chakra-ui/react";
import { json, unstable_defineLoader as defineLoader } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { Leaderboard } from "~/components/Leaderboard";
import { db } from "~/db.server";
import { PathHeader } from "~/components/PathHeader";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";

export const loader = defineLoader(async () => {
  const path = await db.path.findFirst({ where: { slug: "bad-moon" } });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  const bestHCEver = await db.ascension.getLeaderboard({
    path,
    lifestyle: "HARDCORE",
  });
  const bestSCEver = await db.ascension.getLeaderboard({
    path,
    lifestyle: "SOFTCORE",
  });
  const bestCasualEver = await db.ascension.getLeaderboard({
    path,
    lifestyle: "CASUAL",
  });

  const frequency = await db.ascension.getFrequency({ path });
  const recordBreaking = await db.ascension.getRecordBreaking(path, "HARDCORE");

  return {
    path,
    frequency,
    recordBreaking,
    bestHCEver,
    bestSCEver,
    bestCasualEver,
  };
});

export const meta = () => {
  return [
    { title: `Saṃsāra - Bad Moon` },
    {
      name: "description",
      content: `Ascension stats for the Bad Moon path(? sign?)`,
    },
  ];
};

export default function BadMoonPath() {
  const {
    path,
    frequency,
    bestHCEver,
    bestSCEver,
    bestCasualEver,
    recordBreaking,
  } = useLoaderData<typeof loader>();

  return (
    <Stack spacing={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        recordBreaking={recordBreaking}
      />
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
