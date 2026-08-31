import { AccordionValueChangeDetails } from "@chakra-ui/react";
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";

import { Accordion } from "~/components/Accordion";
import { useIsHydrated } from "~/hooks/useIsHydrated";

type Props = {
  children?: React.ReactNode;
};

export function LeaderboardAccordion({ children }: Props) {
  const { hash } = useLocation();
  const navigate = useNavigate();

  const hydrated = useIsHydrated();

  const value = hydrated ? hash.slice(1) : "";

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
