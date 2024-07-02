import { Accordion, Stack } from "@chakra-ui/react";
import { json, unstable_defineLoader as defineLoader } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { Leaderboard } from "~/components/Leaderboard";
import { db } from "~/db.server";
import { PathHeader } from "~/components/PathHeader";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";

export const loader = defineLoader(async () => {
  const path = await db.path.findFirst({ where: { slug: "none" } });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  const scLeaderboard = await db.ascension.getLeaderboard(path, "SOFTCORE");
  const hcLeaderboard = await db.ascension.getLeaderboard(path, "HARDCORE");
  const casualLeaderboard = await db.ascension.getLeaderboard(path, "CASUAL");

  const frequency = await db.ascension.getFrequency(path, undefined);

  const recordBreakers = await db.ascension.getRecordBreaking(path);

  return {
    path,
    frequency,
    scLeaderboard,
    hcLeaderboard,
    casualLeaderboard,
    recordBreakers,
  };
});

export const meta = () => {
  return [
    { title: `Saṃsāra ♻️ - No Path` },
    {
      name: "description",
      content: `Ascension stats for unrestricted ascensions`,
    },
  ];
};

export default function NoPath() {
  const {
    path,
    frequency,
    recordBreakers,
    scLeaderboard,
    hcLeaderboard,
    casualLeaderboard,
  } = useLoaderData<typeof loader>();
  return (
    <Stack spacing={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        recordBreakers={recordBreakers}
      />
      <Accordion allowToggle>
        <LeaderboardAccordionItem
          title="Leaderboards"
          description="The official leaderboards as they currently stand"
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
        <LeaderboardAccordionItem
          title="Casual"
          description="No ronin, no karma, all vibes."
        >
          <Leaderboard
            title="Casual Leaderboard"
            ascensions={casualLeaderboard}
          />
        </LeaderboardAccordionItem>
      </Accordion>
    </Stack>
  );
}
