import { Stack } from "@chakra-ui/react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { Leaderboard } from "~/components/Leaderboard";
import { db, getPathData } from "~/db.server";
import { PathHeader } from "~/components/PathHeader";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { Dedication } from "~/components/Dedication";
import { LeaderboardAccordion } from "~/components/LeaderboardAccordion";

export const loader = async () => {
  const path = await db.path.findFirst({
    where: { slug: "none" },
    include: { class: true },
  });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  return {
    ...(await getPathData(path)),
    casualLeaderboard: await db.ascension.getLeaderboard({
      path,
      lifestyle: "CASUAL",
    }),
    casualDedication: await db.player.getDedication(path, "CASUAL"),
  };
};

export const meta = () => {
  return [
    { title: `Saṃsāra - No Path` },
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
    recordBreaking,
    scLeaderboard,
    hcLeaderboard,
    casualLeaderboard,
    scDedication,
    hcDedication,
    casualDedication,
  } = useLoaderData<typeof loader>();

  return (
    <Stack spacing={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        recordBreaking={recordBreaking}
      />
      <LeaderboardAccordion>
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
          description="No ronin, no karma, all vibes"
        >
          <Leaderboard
            title="Casual Leaderboard"
            ascensions={casualLeaderboard}
          />
          <Dedication title="Casual Dedication" dedication={casualDedication} />
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
