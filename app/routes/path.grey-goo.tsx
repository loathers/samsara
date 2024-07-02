import { Accordion, Stack } from "@chakra-ui/react";
import { JsonValue } from "@prisma/client/runtime/library";
import { json, unstable_defineLoader as defineLoader } from "@remix-run/node";
import { MetaArgs_SingleFetch, useLoaderData } from "@remix-run/react";
import { Leaderboard } from "~/components/Leaderboard";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { PathHeader } from "~/components/PathHeader";
import { db } from "~/db.server";
import { formatPathName } from "~/utils";
import { getLeaderboard } from "~/utils.server";

export const loader = defineLoader(async () => {
  const path = await db.path.findFirst({ where: { slug: "grey-goo" } });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  const bestHCEver = await getLeaderboard(path, "HARDCORE", false, "Goo Score");
  const bestSCEver = await getLeaderboard(path, "SOFTCORE", false, "Goo Score");
  const bestHCInSeason = await getLeaderboard(
    path,
    "HARDCORE",
    true,
    "Goo Score",
  );
  const bestSCInSeason = await getLeaderboard(
    path,
    "SOFTCORE",
    true,
    "Goo Score",
  );

  const frequency = await db.ascension.getFrequency(path);

  const recordBreakers = await db.ascension.getRecordBreaking(path);

  return {
    path,
    frequency,
    recordBreakers,
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
      content: `Ascension stats for the ${formatPathName(data?.path.name ?? "Unknown")} path`,
    },
  ];
};

const numberFormat = new Intl.NumberFormat("en-GB");

function getGooScore(a: { extra: JsonValue }) {
  if (typeof a.extra !== "object" || a.extra === null || Array.isArray(a.extra))
    return 0;
  return numberFormat.format(Number(a.extra["Goo Score"] ?? 0));
}

export default function GreyGooPath() {
  const {
    path,
    frequency,
    recordBreakers,
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
        recordBreakers={recordBreakers}
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
