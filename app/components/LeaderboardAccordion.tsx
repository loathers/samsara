import { AccordionValueChangeDetails } from "@chakra-ui/react";
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";

import { Accordion } from "~/components/Accordion";
import { useIsHydrated } from "~/hooks/useIsHydrated";

type Props = {
  children?: React.ReactNode;
  /**
   * Maps the URL hash to the item this accordion should open. Nested accordions share
   * one hash, which points at a leaf: an outer accordion maps a leaf back to the section
   * holding it, and an inner one maps its section's own hash to a board to open.
   */
  toItemValue?: (hash: string) => string;
};

export function LeaderboardAccordion({ children, toItemValue }: Props) {
  const { hash } = useLocation();
  const navigate = useNavigate();

  const hydrated = useIsHydrated();

  const current = hydrated ? hash.slice(1) : "";
  const value = current && toItemValue ? toItemValue(current) : current;

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
