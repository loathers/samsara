import { Accordion, Stack } from "@chakra-ui/react";
import { JsonValue } from "@prisma/client/runtime/library";
import { json, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useMemo } from "react";
import { Leaderboard } from "~/components/Leaderboard";
import { db } from "~/db.server";
import { getLeaderboard } from "~/utils.server";
import { formatPathName } from "~/utils";
import { PathHeader } from "~/components/PathHeader";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";

export const loader = async () => {
  const slug = "one-crazy-random-summer";

  const path = await db.path.findFirst({ where: { slug } });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  const bestHCEver = await getLeaderboard(path.name, "HARDCORE");
  const bestSCEver = await getLeaderboard(path.name, "SOFTCORE");
  const funnestHCEver = await getLeaderboard(path.name, "HARDCORE", "Fun");
  const funnestSCEver = await getLeaderboard(path.name, "SOFTCORE", "Fun");

  const funnestHCInSeason = path.end
    ? await getLeaderboard(path.name, "HARDCORE", "Fun", path.end)
    : null;
  const funnestSCInSeason = path.end
    ? await getLeaderboard(path.name, "SOFTCORE", "Fun", path.end)
    : null;
  const bestHCInSeason = path.end
    ? await getLeaderboard(path.name, "HARDCORE", undefined, path.end)
    : null;
  const bestSCInSeason = path.end
    ? await getLeaderboard(path.name, "SOFTCORE", undefined, path.end)
    : null;

  const stats = await db.ascension.getStats(undefined, path.name);

  return json({
    bestHCEver,
    bestHCInSeason,
    bestSCEver,
    bestSCInSeason,
    funnestHCEver,
    funnestHCInSeason,
    funnestSCEver,
    funnestSCInSeason,
    path,
    stats,
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

function getFunScore(a: { extra: JsonValue }) {
  if (typeof a.extra !== "object" || a.extra === null || Array.isArray(a.extra))
    return 0;
  return numberFormat.format(Number(a.extra["Fun"] ?? 0));
}

export default function OCRSPath() {
  const {
    bestHCEver,
    bestHCInSeason,
    bestSCEver,
    bestSCInSeason,
    funnestHCEver,
    funnestHCInSeason,
    funnestSCEver,
    funnestSCInSeason,
    path,
    stats,
  } = useLoaderData<typeof loader>();

  const scLeaderboard = useMemo(
    () => bestSCInSeason?.map((a) => ({ ...a, date: new Date(a.date) })),
    [bestSCInSeason],
  );
  const hcLeaderboard = useMemo(
    () => bestHCInSeason?.map((a) => ({ ...a, date: new Date(a.date) })),
    [bestHCInSeason],
  );
  const scFunLeaderboard = useMemo(
    () => funnestSCInSeason?.map((a) => ({ ...a, date: new Date(a.date) })),
    [funnestSCInSeason],
  );
  const hcFunLeaderboard = useMemo(
    () => funnestHCInSeason?.map((a) => ({ ...a, date: new Date(a.date) })),
    [funnestHCInSeason],
  );
  const scFunPyrites = useMemo(
    () => funnestSCEver.map((a) => ({ ...a, date: new Date(a.date) })),
    [funnestSCEver],
  );
  const hcFunPyrites = useMemo(
    () => funnestHCEver.map((a) => ({ ...a, date: new Date(a.date) })),
    [funnestHCEver],
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
        {scFunLeaderboard && hcFunLeaderboard && (
          <LeaderboardAccordionItem
            title="Leaderboards (Fun)"
            description={
              <>
                The leaderboards frozen once the path went out-of-season. This
                season was ranked by <i>Fun</i> score, rather than days and
                turns.
              </>
            }
          >
            <Leaderboard
              title="Softcore Leaderboard"
              ascensions={scFunLeaderboard}
              alternativeScore={["Fun", getFunScore]}
            />
            <Leaderboard
              title="Hardcore Leaderboard"
              ascensions={hcFunLeaderboard}
              alternativeScore={["Fun", getFunScore]}
            />
          </LeaderboardAccordionItem>
        )}
        {scLeaderboard && hcLeaderboard && (
          <LeaderboardAccordionItem
            title="Leaderboards (Days/Turns)"
            description="Essentially a special pyrite; in-season leaderboards had this had been a normally ranked path."
          >
            <Leaderboard
              title="Softcore Leaderboard"
              ascensions={scLeaderboard}
              alternativeScore={["Fun", getFunScore]}
            />
            <Leaderboard
              title="Hardcore Leaderboard"
              ascensions={hcLeaderboard}
              alternativeScore={["Fun", getFunScore]}
            />
          </LeaderboardAccordionItem>
        )}
        <LeaderboardAccordionItem title="Pyrites (Fun)" description="{PYRITE}">
          <Leaderboard
            title="Softcore Pyrites"
            ascensions={scFunPyrites}
            alternativeScore={["Fun", getFunScore]}
          />
          <Leaderboard
            title="Hardcore Pyrites"
            ascensions={hcFunPyrites}
            alternativeScore={["Fun", getFunScore]}
          />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          title="Pyrites (Days/Turns)"
          description="A doubly hypothetical leaderboard for all-time; invented, respected, and dominated by turbo-fools."
        >
          <Leaderboard
            title="Softcore Pyrites"
            ascensions={scPyrites}
            alternativeScore={["Fun", getFunScore]}
          />
          <Leaderboard
            title="Hardcore Pyrites"
            ascensions={hcPyrites}
            alternativeScore={["Fun", getFunScore]}
          />
        </LeaderboardAccordionItem>
      </Accordion>
    </Stack>
  );
}
