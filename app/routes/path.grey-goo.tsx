import { Accordion, Stack } from "@chakra-ui/react";
import { JsonValue } from "@prisma/client/runtime/library";
import { json, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useMemo } from "react";
import { Leaderboard } from "~/components/Leaderboard";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { PathHeader } from "~/components/PathHeader";
import { db } from "~/db.server";
import { formatPathName } from "~/utils";
import { getLeaderboard } from "~/utils.server";

export const loader = async () => {
  const slug = "grey-goo";

  const path = await db.path.findFirst({ where: { slug } });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  const bestHCEver = await getLeaderboard(path.name, "HARDCORE", "Goo Score");
  const bestSCEver = await getLeaderboard(path.name, "SOFTCORE", "Goo Score");
  const bestHCInSeason = path.end
    ? await getLeaderboard(path.name, "HARDCORE", "Goo Score", path.end)
    : null;
  const bestSCInSeason = path.end
    ? await getLeaderboard(path.name, "SOFTCORE", "Goo Score", path.end)
    : null;

  const stats = await db.ascension.getStats(undefined, path.name);

  return json({
    path,
    stats,
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
      <PathHeader path={path} stats={stats} />
      <Accordion allowToggle>
        {scLeaderboard && hcLeaderboard && (
          <LeaderboardAccordionItem
            title="Leaderboards (Goo)"
            description="The official leaderboards frozen once the path went out-of-season. This season was ranked by Goo score, rather than days and turns."
          >
            <Leaderboard
              title="Softcore Leaderboard"
              ascensions={scLeaderboard}
              alternativeScore={["Goo", getGooScore]}
            />
            <Leaderboard
              title="Hardcore Leaderboard"
              ascensions={hcLeaderboard}
              alternativeScore={["Goo", getGooScore]}
            />
          </LeaderboardAccordionItem>
        )}
        <LeaderboardAccordionItem title="Pyrites (Goo)" description="{PYRITE}">
          <Leaderboard
            title="Softcore Leaderboard"
            ascensions={scPyrites}
            alternativeScore={["Goo", getGooScore]}
          />
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={hcPyrites}
            alternativeScore={["Goo", getGooScore]}
          />
        </LeaderboardAccordionItem>
      </Accordion>
    </Stack>
  );
}
