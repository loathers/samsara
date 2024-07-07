import { Accordion, Stack } from "@chakra-ui/react";
import { json, unstable_defineLoader as defineLoader } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Leaderboard } from "~/components/Leaderboard";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { PathHeader } from "~/components/PathHeader";
import { db } from "~/db.server";
import { getExtra } from "~/utils";

export const loader = defineLoader(async () => {
  const path = await db.path.findFirst({ where: { slug: "grey-goo" } });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  return {
    path,
    frequency: await db.ascension.getFrequency({ path }),
    recordBreaking: await db.ascension.getRecordBreaking(path),
    bestHCEver: await db.ascension.getLeaderboard({
      path,
      lifestyle: "HARDCORE",
      special: true,
    }),
    bestSCEver: await db.ascension.getLeaderboard({
      path,
      lifestyle: "SOFTCORE",
      special: true,
    }),
    bestHCInSeason: await db.ascension.getLeaderboard({
      path,
      lifestyle: "HARDCORE",
      inSeason: true,
      special: true,
    }),
    bestSCInSeason: await db.ascension.getLeaderboard({
      path,
      lifestyle: "SOFTCORE",
      inSeason: true,
      special: true,
    }),
    hcDedication: await db.player.getDedication(path, "HARDCORE"),
    scDedication: await db.player.getDedication(path, "SOFTCORE"),
  };
});

export const meta = () => {
  return [
    { title: `Saṃsāra - Grey Goo` },
    {
      name: "description",
      content: `Ascension stats for the Grey Goo path`,
    },
  ];
};

const getGooScore = getExtra("Goo Score");

export default function GreyGooPath() {
  const {
    path,
    frequency,
    recordBreaking,
    bestHCInSeason,
    bestHCEver,
    bestSCEver,
    bestSCInSeason,
  } = useLoaderData<typeof loader>();

  return (
    <Stack spacing={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        recordBreaking={recordBreaking}
        extra="Goo Score"
      />
      <Accordion allowToggle>
        <LeaderboardAccordionItem
          title="Leaderboards (Goo)"
          description="The official leaderboards frozen once the path went out-of-season. This season was ranked by Goo score, rather than days and turns."
        >
          <Leaderboard
            title="Softcore Leaderboard"
            ascensions={bestSCInSeason}
            alternativeScore={["Goo", getGooScore]}
          />
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={bestHCInSeason}
            alternativeScore={["Goo", getGooScore]}
          />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem title="Pyrites (Goo)" description="{PYRITE}">
          <Leaderboard
            title="Softcore Leaderboard"
            ascensions={bestSCEver}
            alternativeScore={["Goo", getGooScore]}
          />
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={bestHCEver}
            alternativeScore={["Goo", getGooScore]}
          />
        </LeaderboardAccordionItem>
      </Accordion>
    </Stack>
  );
}
