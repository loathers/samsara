import { Accordion, Stack } from "@chakra-ui/react";
import { json, unstable_defineLoader as defineLoader } from "@remix-run/node";
import { MetaArgs_SingleFetch, useLoaderData } from "@remix-run/react";

import { Leaderboard } from "~/components/Leaderboard";
import { formatPathName } from "~/components/Path";
import { PathHeader } from "~/components/PathHeader";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { Dedication } from "~/components/Dedication";
import { db, getPathData } from "~/db.server";
import { useAccordionNavigation } from "~/useAccordionNavigation";

export const loader = defineLoader(async ({ params }) => {
  const { slug } = params;
  const path = await db.path.findFirst({
    where: { slug },
    include: { class: true },
  });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  return await getPathData(path);
});

export const meta = ({ data }: MetaArgs_SingleFetch<typeof loader>) => {
  return [
    { title: `Saṃsāra - ${formatPathName(data?.path)}` },
    {
      name: "description",
      content: `Ascension stats for the ${formatPathName(data?.path)} path`,
    },
  ];
};

const ACCORDION_ITEMS = ["leaderboards", "pyrites", "dedication"];

export default function PathPage() {
  const {
    current,
    frequency,
    hcDedication,
    hcLeaderboard,
    hcPyrite,
    path,
    recordBreaking,
    scDedication,
    scLeaderboard,
    scPyrite,
  } = useLoaderData<typeof loader>();

  const showClass = path.class.length !== 1;

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
            showClass={showClass}
          />
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={hcLeaderboard}
            showClass={showClass}
          />
        </LeaderboardAccordionItem>
        {scPyrite.length + hcPyrite.length > 0 && (
          <LeaderboardAccordionItem title="Pyrites" description="{PYRITE}">
            <Leaderboard
              title="Softcore Pyrites"
              ascensions={scPyrite}
              showClass={showClass}
            />
            <Leaderboard
              title="Hardcore Pyrites"
              ascensions={hcPyrite}
              showClass={showClass}
            />
          </LeaderboardAccordionItem>
        )}
        <LeaderboardAccordionItem
          title="Dedication"
          description="Players who have completed the most ascensions for this path"
        >
          <Dedication title="Softcore Dedication" dedication={scDedication} />
          <Dedication title="Hardcore Dedication" dedication={hcDedication} />
        </LeaderboardAccordionItem>
      </Accordion>
    </Stack>
  );
}
