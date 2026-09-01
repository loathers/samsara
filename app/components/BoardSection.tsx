import { boardHash } from "~/boards";
import { LeaderboardAccordion } from "~/components/LeaderboardAccordion";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";

export type BoardContent = {
  key: string | null;
  label: string;
  description?: React.ReactNode;
  content: React.ReactNode;
};

type Props = {
  slug: string;
  title: string;
  description: React.ReactNode;
  boards: BoardContent[];
};

/**
 * Several boards nest, one shows directly. The section keeps the bare slug either way, so
 * a medal linking to a board opens the right section whether or not it nests.
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
      {/* No mapping, so opening a section leaves its boards closed. */}
      <LeaderboardAccordion leaf>
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
