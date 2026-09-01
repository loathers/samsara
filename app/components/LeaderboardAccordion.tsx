import { AccordionValueChangeDetails } from "@chakra-ui/react";
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";

import { hashSection } from "~/boards";
import { Accordion } from "~/components/Accordion";
import { useIsHydrated } from "~/hooks/useIsHydrated";

type Props = {
  children?: React.ReactNode;
  /** Nested inside a section, so its items are the leaves the hash names. */
  leaf?: boolean;
};

export function LeaderboardAccordion({ children, leaf = false }: Props) {
  const { hash } = useLocation();
  const navigate = useNavigate();

  const hydrated = useIsHydrated();

  const current = hydrated ? hash.slice(1) : "";
  const value = leaf ? current : hashSection(current);

  const onChange = useCallback(
    (details: AccordionValueChangeDetails) => {
      navigate({ hash: details.value[0] ?? "" }, { replace: true });
    },
    [navigate],
  );

  return (
    <Accordion.Root
      onValueChange={onChange}
      value={value ? [value] : []}
      collapsible
    >
      {children}
    </Accordion.Root>
  );
}
