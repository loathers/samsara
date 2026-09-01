import { boardHash } from "~/boards";
import { LeaderboardAccordion } from "~/components/LeaderboardAccordion";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";

export type BoardContent = {
  /** Board key, or null where the section covers the path as a whole. */
  key: string | null;
  label: string;
  description?: React.ReactNode;
  content: React.ReactNode;
};

type Props = {
  /** Section slug, e.g. "leaderboards". Boards nest beneath it as "leaderboards.blue". */
  slug: string;
  title: string;
  description: React.ReactNode;
  boards: BoardContent[];
};

/**
 * One section of a path page. A section covering several boards nests them, so a path
 * opens with the same headings however many boards it ranks; a section covering one
 * shows it directly.
 *
 * The section keeps the bare slug either way, so a medal deep-linking to a board lands
 * on the right section whether or not that section happens to nest.
 */
export function BoardSection({ slug, title, description, boards }: Props) {
  if (boards.length === 0) return null;

  if (boards.length === 1) {
    return (
      <LeaderboardAccordionItem
        slug={slug}
        title={title}
        description={description}
      >
        {boards[0].content}
      </LeaderboardAccordionItem>
    );
  }

  return (
    <LeaderboardAccordionItem
      slug={slug}
      title={title}
      description={description}
      stacked
    >
      {/* No hash mapping: the bare section hash matches no board, so opening a section
          leaves its boards closed until one is picked. */}
      <LeaderboardAccordion>
        {boards.map((board) => (
          <LeaderboardAccordionItem
            key={board.key ?? "default"}
            slug={boardHash(board.key, slug)}
            title={board.label}
            description={board.description ?? ""}
          >
            {board.content}
          </LeaderboardAccordionItem>
        ))}
      </LeaderboardAccordion>
    </LeaderboardAccordionItem>
  );
}
