import { Stack } from "@chakra-ui/react";
import {
  type LoaderFunctionArgs,
  type MetaArgs,
  data,
  redirect,
  useLoaderData,
} from "react-router";

import { boardHash, hashSection } from "~/boards";
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

type Category = {
  slug: string;
  title: string;
  description: (current: boolean) => React.ReactNode;
  /** Whether this board has anything to show under this heading. */
  show?: (board: BoardData) => boolean;
  content: (board: BoardData, showClass: boolean) => React.ReactNode;
};

const CATEGORIES: Category[] = [
  {
    slug: "leaderboards",
    title: "Leaderboards",
    description: (current) =>
      current
        ? "The official leaderboards as they currently stand"
        : "The official leaderboards frozen once the path went out-of-season",
    content: (b, showClass) => (
      <>
        <Leaderboard
          title="Softcore Leaderboard"
          ascensions={b.scLeaderboard}
          showClass={showClass}
          omitExtra={b.board.extraEquals?.[0]}
        >
          <ClassComparisonChart data={b.classes.main.softcore} />
        </Leaderboard>
        <Leaderboard
          title="Hardcore Leaderboard"
          ascensions={b.hcLeaderboard}
          showClass={showClass}
          omitExtra={b.board.extraEquals?.[0]}
        >
          <ClassComparisonChart data={b.classes.main.hardcore} />
        </Leaderboard>
      </>
    ),
  },
  {
    slug: "pyrites",
    title: "Pyrites",
    description: () => "{PYRITE}",
    show: (b) => b.scPyrite.length + b.hcPyrite.length > 0,
    content: (b, showClass) => (
      <>
        <Leaderboard
          title="Softcore Pyrites"
          ascensions={b.scPyrite}
          showClass={showClass}
          omitExtra={b.board.extraEquals?.[0]}
        >
          <ClassComparisonChart data={b.classes.pyrite.softcore} />
        </Leaderboard>
        <Leaderboard
          title="Hardcore Pyrites"
          ascensions={b.hcPyrite}
          showClass={showClass}
          omitExtra={b.board.extraEquals?.[0]}
        >
          <ClassComparisonChart data={b.classes.pyrite.hardcore} />
        </Leaderboard>
      </>
    ),
  },
  {
    slug: "recent",
    title: "Recent Ascensions",
    description: () => "The most recent ascensions on this path",
    content: (b, showClass) => (
      <>
        <Leaderboard
          title="Softcore"
          ascensions={b.scRecent}
          ranked={false}
          showClass={showClass}
          omitExtra={b.board.extraEquals?.[0]}
        />
        <Leaderboard
          title="Hardcore"
          ascensions={b.hcRecent}
          ranked={false}
          showClass={showClass}
          omitExtra={b.board.extraEquals?.[0]}
        />
      </>
    ),
  },
  {
    slug: "dedication",
    title: "Dedication",
    description: () =>
      "Players who have completed the most ascensions for this path",
    content: (b) => (
      <>
        <Dedication title="Softcore Dedication" dedication={b.scDedication} />
        <Dedication title="Hardcore Dedication" dedication={b.hcDedication} />
      </>
    ),
  },
];

/** A board's own discriminator is redundant in a table that is only that board. */
const showClassFor = (board: BoardData, showClass: boolean) =>
  showClass && !board.board.className;

export default function PathPage() {
  const { boards, current, frequency, path, totalRuns, totalRunsInSeason } =
    useLoaderData<typeof loader>();

  const showClass = path.class.length !== 1;
  const split = boards.length > 1;

  return (
    <Stack gap={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        boards={boards}
        totalRuns={totalRuns}
        totalRunsInSeason={totalRunsInSeason}
      />
      <LeaderboardAccordion toItemValue={split ? hashSection : undefined}>
        {CATEGORIES.filter((category) =>
          boards.some((board) => category.show?.(board) ?? true),
        ).map((category) => (
          <LeaderboardAccordionItem
            key={category.slug}
            slug={category.slug}
            title={category.title}
            description={category.description(current)}
            stacked={split}
          >
            {split ? (
              // No mapping here: the bare section hash matches no board, so opening a
              // section leaves its boards closed until one is picked.
              <LeaderboardAccordion>
                {boards
                  .filter((board) => category.show?.(board) ?? true)
                  .map((board) => (
                    <LeaderboardAccordionItem
                      key={board.board.key ?? "default"}
                      slug={boardHash(board.board.key, category.slug)}
                      title={board.board.label}
                      description=""
                    >
                      {category.content(board, showClassFor(board, showClass))}
                    </LeaderboardAccordionItem>
                  ))}
              </LeaderboardAccordion>
            ) : (
              category.content(boards[0], showClassFor(boards[0], showClass))
            )}
          </LeaderboardAccordionItem>
        ))}
      </LeaderboardAccordion>
    </Stack>
  );
}
