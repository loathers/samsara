import { Accordion, Stack } from "@chakra-ui/react";
import { json, unstable_defineLoader as defineLoader } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { Leaderboard } from "~/components/Leaderboard";
import { db, getKittycoreLeaderboard, getPathData } from "~/db.server";
import { PathHeader } from "~/components/PathHeader";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { Dedication } from "~/components/Dedication";
import { useAccordionNavigation } from "~/useAccordionNavigation";

export const loader = defineLoader(async () => {
  const path = await db.path.findFirst({
    where: { slug: "bad-moon" },
    include: { class: true },
  });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  return {
    ...(await getPathData(path)),
    casualLeaderboard: await db.ascension.getLeaderboard({
      path,
      lifestyle: "CASUAL",
    }),
    kittycoreLeaderboard: await getKittycoreLeaderboard(),
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

const ACCORDION_ITEMS = ["leaderboard", "kittycore", "weird", "dedication"];

export default function BadMoonPath() {
  const {
    casualLeaderboard,
    frequency,
    hcDedication,
    hcLeaderboard,
    kittycoreLeaderboard,
    path,
    recordBreaking,
    scLeaderboard,
  } = useLoaderData<typeof loader>();

  const accordionProps = useAccordionNavigation(ACCORDION_ITEMS);

  return (
    <Stack spacing={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        recordBreaking={recordBreaking}
      />
      <Accordion allowToggle {...accordionProps}>
        <LeaderboardAccordionItem
          title="Leaderboard"
          description="The official leaderboard as it currently stands"
        >
          <Leaderboard ascensions={hcLeaderboard} />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          title="Kittycore"
          description="Who has managed to condense the worst experience in the game into the smallest amount of time"
        >
          <Leaderboard ascensions={kittycoreLeaderboard} />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          title="Weird leaderboards"
          description="Some curious folks managed to run the path outside of Hardcore and we must respect their work"
        >
          <Leaderboard
            title="Softcore Leaderboard?"
            ascensions={scLeaderboard}
          />
          <Leaderboard
            title="Casual? Leaderboard??"
            ascensions={casualLeaderboard}
          />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          title="Dedication"
          description="Players who have completed the most ascensions for this path"
        >
          <Dedication title="Dedication" dedication={hcDedication} />
        </LeaderboardAccordionItem>
      </Accordion>
    </Stack>
  );
}
