import { Accordion, Stack } from "@chakra-ui/react";
import { json, unstable_defineLoader as defineLoader } from "@remix-run/node";
import { MetaArgs_SingleFetch, useLoaderData } from "@remix-run/react";

import { Leaderboard } from "~/components/Leaderboard";
import { db } from "~/db.server";
import { formatPathName } from "~/components/Path";
import { PathHeader } from "~/components/PathHeader";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { calculateRange } from "~/utils";

export const loader = defineLoader(async ({ params }) => {
  const { slug } = params;
  const path = await db.path.findFirst({ where: { slug } });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  const standard = path.name === "Standard";

  const current =
    (path.start &&
      path.end &&
      new Date() > path.start &&
      new Date() < path.end) ??
    true;
  const hasPyrites = path.seasonal && (!current || standard);

  if (standard) {
    path.start = new Date(new Date().getFullYear(), 0, 1);
    path.end = new Date(new Date().getFullYear(), 11, 31);
  }

  const bestSCEver = await db.ascension.getLeaderboard(path, "SOFTCORE");
  const bestHCEver = await db.ascension.getLeaderboard(path, "HARDCORE");

  const [scLeaderboard, hcLeaderboard, scPyrite, hcPyrite] = hasPyrites
    ? [
        await db.ascension.getLeaderboard(path, "SOFTCORE", true),
        await db.ascension.getLeaderboard(path, "HARDCORE", true),
        bestSCEver,
        bestHCEver,
      ]
    : [bestSCEver, bestHCEver, [], []];

  const frequency = await db.ascension.getFrequency(
    path,
    undefined,
    calculateRange(path.start ?? new Date(0), new Date()),
  );

  const recordBreakers = await db.ascension.getRecordBreaking(path);

  return {
    path,
    frequency,
    current,
    scLeaderboard,
    hcLeaderboard,
    scPyrite,
    hcPyrite,
    recordBreakers,
  };
});

export const meta = ({ data }: MetaArgs_SingleFetch<typeof loader>) => {
  return [
    { title: `Saṃsāra ♻️ - ${formatPathName(data?.path)}` },
    {
      name: "description",
      content: `Ascension stats for the ${formatPathName(data?.path)} path`,
    },
  ];
};

export default function Path() {
  const {
    path,
    current,
    frequency,
    recordBreakers,
    scLeaderboard,
    hcLeaderboard,
    scPyrite,
    hcPyrite,
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
          description={
            current
              ? "The official leaderboards as they currently stand"
              : "The official leaderboards frozen once the path went out-of-season"
          }
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
        {scPyrite.length + hcPyrite.length > 0 && (
          <LeaderboardAccordionItem title="Pyrites" description="{PYRITE}">
            <Leaderboard title="Softcore Pyrites" ascensions={scPyrite} />
            <Leaderboard title="Hardcore Pyrites" ascensions={hcPyrite} />
          </LeaderboardAccordionItem>
        )}
      </Accordion>
    </Stack>
  );
}
