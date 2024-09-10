import { Accordion } from "@chakra-ui/react";
import { Children, useCallback } from "react";
import { LeaderboardAccordionItem } from "./LeaderboardAccordionItem";
import { useLocation, useNavigate } from "@remix-run/react";

type Props = {
  children?: React.ReactNode;
};

type LeaderboardAccordionItemProps = React.ComponentProps<
  typeof LeaderboardAccordionItem
>;

function isLeaderboardAccordionItemProps(
  props: unknown,
): props is LeaderboardAccordionItemProps {
  return (
    typeof props === "object" &&
    props !== null &&
    "title" in props &&
    typeof props.title === "string"
  );
}

export function LeaderboardAccordion({ children }: Props) {
  const { hash } = useLocation();
  const navigate = useNavigate();

  const items =
    Children.map(children, (child) => {
      if (!(typeof child === "object") || child === null || !("props" in child))
        return null;
      const props = child.props;
      if (!isLeaderboardAccordionItemProps(props)) return null;
      return props.slug ?? props.title.toLowerCase();
    })?.filter((s) => s !== null) ?? [];

  const defaultIndex = items.indexOf(hash.slice(1));
  const onChange = useCallback(
    (index: number) => {
      navigate({ hash: index >= 0 ? items[index] : undefined });
    },
    [items, navigate],
  );

  return (
    <Accordion allowToggle onChange={onChange} defaultIndex={defaultIndex}>
      {children}
    </Accordion>
  );
}
