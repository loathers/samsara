import { Accordion, Stack } from "@chakra-ui/react";
import { json, unstable_defineLoader as defineLoader } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { Leaderboard } from "~/components/Leaderboard";
import { db } from "~/db.server";
import { PathHeader } from "~/components/PathHeader";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { Dedication } from "~/components/Dedication";

export const loader = defineLoader(async () => {
  const path = await db.path.findFirst({ where: { slug: "bad-moon" } });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  return {
    bestCasualEver: await db.ascension.getLeaderboard({
      path,
      lifestyle: "CASUAL",
    }),
    bestHCEver: await db.ascension.getLeaderboard({
      path,
      lifestyle: "HARDCORE",
    }),
    bestSCEver: await db.ascension.getLeaderboard({
      path,
      lifestyle: "SOFTCORE",
    }),
    dedication: await db.player.getDedication(path, "HARDCORE"),
    frequency: await db.ascension.getFrequency({ path }),
    path,
    recordBreaking: await db.ascension.getRecordBreaking(path, "HARDCORE"),
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
    bestCasualEver,
    bestHCEver,
    bestSCEver,
    dedication,
    frequency,
    path,
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
        <LeaderboardAccordionItem
          title="Dedication"
          description="Players who have completed the most ascensions for this path"
        >
          <Dedication title="Dedication" dedication={dedication} />
        </LeaderboardAccordionItem>
      </Accordion>
    </Stack>
  );
}
