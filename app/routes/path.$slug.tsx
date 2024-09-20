import { Stack } from "@chakra-ui/react";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { MetaArgs, redirect, useLoaderData } from "@remix-run/react";

import { Leaderboard } from "~/components/Leaderboard";
import { formatPathName } from "~/components/Path";
import { PathHeader } from "~/components/PathHeader";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { Dedication } from "~/components/Dedication";
import { db } from "~/db.server";
import { getPathData } from "~/path.server";
import { LeaderboardAccordion } from "~/components/LeaderboardAccordion";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  let { slug } = params;

  slug = slug?.toLowerCase();

  const id = Number.isNaN(Number(slug)) ? undefined : Number(slug);

  const path = await db.path.findFirst({
    where: { OR: [{ slug }, { id }] },
    include: { class: true },
  });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  // Redirect to the slug form of the path
  if (slug !== path.slug) {
    throw redirect(`/path/${path.slug}`);
  }

  return json(await getPathData(path));
};

export const meta = ({ data }: MetaArgs<typeof loader>) => {
  return [
    { title: `Saṃsāra - ${formatPathName(data?.path)}` },
    {
      name: "description",
      content: `Ascension stats for the ${formatPathName(data?.path)} path`,
    },
  ];
};

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
  const showPyrites = scPyrite.length + hcPyrite.length > 0;

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
        {showPyrites && (
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
      </LeaderboardAccordion>
    </Stack>
  );
}
