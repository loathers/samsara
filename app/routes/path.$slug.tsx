import { Stack } from "@chakra-ui/react";
import {
  type LoaderFunctionArgs,
  type MetaArgs,
  data,
  redirect,
  useLoaderData,
} from "react-router";

import { boardHash, boardTitle } from "~/boards";
import { ClassComparisonChart } from "~/components/ClassComparisonChart/ClassComparisonChart";
import { Dedication } from "~/components/Dedication";
import { Leaderboard } from "~/components/Leaderboard";
import { LeaderboardAccordion } from "~/components/LeaderboardAccordion";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { PathHeader } from "~/components/PathHeader";
import { findPathWithClasses } from "~/db.server";
import { type BoardData, getPathData } from "~/path.server";
import { formatPathName } from "~/utils";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  let { slug } = params;

  slug = slug?.toLowerCase();

  const id = Number.isNaN(Number(slug)) ? undefined : Number(slug);

  const path = await findPathWithClasses({ slug, id });

  if (!path) throw data({ message: "Invalid path name" }, { status: 400 });

  // Redirect to the slug form of the path
  if (slug !== path.slug) {
    throw redirect(`/path/${path.slug}`);
  }

  return await getPathData(path);
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

/**
 * A path's sections. Most paths have a single unnamed board, in which case the titles
 * and hashes are exactly what they have always been; a path that ranks several boards
 * gets one set of sections per board, labelled and hashed by board.
 */
function BoardSections({
  board: {
    board,
    classes,
    hcDedication,
    hcLeaderboard,
    hcPyrite,
    hcRecent,
    scDedication,
    scLeaderboard,
    scPyrite,
    scRecent,
  },
  current,
  showClass,
}: {
  board: BoardData;
  current: boolean;
  showClass: boolean;
}) {
  const showPyrites = scPyrite.length + hcPyrite.length > 0;

  // The board's own discriminator is redundant in a table that is only that board.
  const omitExtra = board.extraEquals?.[0];

  return (
    <>
      <LeaderboardAccordionItem
        slug={boardHash(board.key, "leaderboards")}
        title={boardTitle(board.label, "Leaderboards")}
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
          omitExtra={omitExtra}
        >
          <ClassComparisonChart data={classes.main.softcore} />
        </Leaderboard>
        <Leaderboard
          title="Hardcore Leaderboard"
          ascensions={hcLeaderboard}
          showClass={showClass}
          omitExtra={omitExtra}
        >
          <ClassComparisonChart data={classes.main.hardcore} />
        </Leaderboard>
      </LeaderboardAccordionItem>
      {showPyrites && (
        <LeaderboardAccordionItem
          slug={boardHash(board.key, "pyrites")}
          title={boardTitle(board.label, "Pyrites")}
          description="{PYRITE}"
        >
          <Leaderboard
            title="Softcore Pyrites"
            ascensions={scPyrite}
            showClass={showClass}
            omitExtra={omitExtra}
          >
            <ClassComparisonChart data={classes.pyrite.softcore} />
          </Leaderboard>
          <Leaderboard
            title="Hardcore Pyrites"
            ascensions={hcPyrite}
            showClass={showClass}
            omitExtra={omitExtra}
          >
            <ClassComparisonChart data={classes.pyrite.hardcore} />
          </Leaderboard>
        </LeaderboardAccordionItem>
      )}
      <LeaderboardAccordionItem
        slug={boardHash(board.key, "recent")}
        title={boardTitle(board.label, "Recent Ascensions")}
        description="The most recent ascensions on this path"
      >
        <Leaderboard
          title="Softcore"
          ascensions={scRecent}
          ranked={false}
          showClass={showClass}
          omitExtra={omitExtra}
        />
        <Leaderboard
          title="Hardcore"
          ascensions={hcRecent}
          ranked={false}
          showClass={showClass}
          omitExtra={omitExtra}
        />
      </LeaderboardAccordionItem>
      <LeaderboardAccordionItem
        slug={boardHash(board.key, "dedication")}
        title={boardTitle(board.label, "Dedication")}
        description="Players who have completed the most ascensions for this path"
      >
        <Dedication title="Softcore Dedication" dedication={scDedication} />
        <Dedication title="Hardcore Dedication" dedication={hcDedication} />
      </LeaderboardAccordionItem>
    </>
  );
}

export default function PathPage() {
  const { boards, current, frequency, path, totalRuns, totalRunsInSeason } =
    useLoaderData<typeof loader>();

  const showClass = path.class.length !== 1;

  return (
    <Stack gap={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        boards={boards}
        totalRuns={totalRuns}
        totalRunsInSeason={totalRunsInSeason}
      />
      <LeaderboardAccordion>
        {boards.map((board) => (
          <BoardSections
            key={board.board.key ?? "default"}
            board={board}
            current={current}
            showClass={showClass}
          />
        ))}
      </LeaderboardAccordion>
    </Stack>
  );
}
