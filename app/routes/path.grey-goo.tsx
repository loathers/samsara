import { Accordion, Stack } from "@chakra-ui/react";
import { json, unstable_defineLoader as defineLoader } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Leaderboard } from "~/components/Leaderboard";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { PathHeader } from "~/components/PathHeader";
import { db, getPathData } from "~/db.server";
import { useAccordionNavigation } from "~/useAccordionNavigation";
import { getExtra } from "~/utils";

export const loader = defineLoader(async () => {
  const path = await db.path.findFirst({
    where: { slug: "grey-goo" },
    include: { class: true },
  });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  return await getPathData(path, true);
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

const ACCORDION_ITEMS = ["leaderboards", "pyrites"];

export default function GreyGooPath() {
  const {
    frequency,
    hcSpecialLeaderboard,
    hcSpecialPyrite,
    path,
    recordBreaking,
    scSpecialLeaderboard,
    scSpecialPyrite,
  } = useLoaderData<typeof loader>();

  const accordionProps = useAccordionNavigation(ACCORDION_ITEMS);

  return (
    <Stack spacing={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        recordBreaking={recordBreaking}
        extra="Goo Score"
      />
      <Accordion allowToggle {...accordionProps}>
        <LeaderboardAccordionItem
          title="Leaderboards (Goo)"
          description="The official leaderboards frozen once the path went out-of-season. This season was ranked by Goo score, rather than days and turns"
        >
          <Leaderboard
            title="Softcore Leaderboard"
            ascensions={scSpecialLeaderboard}
            alternativeScore={["Goo", getGooScore]}
          />
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={hcSpecialLeaderboard}
            alternativeScore={["Goo", getGooScore]}
          />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem title="Pyrites (Goo)" description="{PYRITE}">
          <Leaderboard
            title="Softcore Leaderboard"
            ascensions={scSpecialPyrite}
            alternativeScore={["Goo", getGooScore]}
          />
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={hcSpecialPyrite}
            alternativeScore={["Goo", getGooScore]}
          />
        </LeaderboardAccordionItem>
      </Accordion>
    </Stack>
  );
}
