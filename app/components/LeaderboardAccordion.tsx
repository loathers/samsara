import { AccordionValueChangeDetails } from "@chakra-ui/react";
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";

import { Accordion } from "~/components/Accordion";

type Props = {
  children?: React.ReactNode;
};

export function LeaderboardAccordion({ children }: Props) {
  const { hash } = useLocation();
  const navigate = useNavigate();

  const defaultValue = hash.slice(1);

  const onChange = useCallback(
    (details: AccordionValueChangeDetails) => {
      navigate({ hash: details.value[0] });
    },
    [navigate],
  );

  return (
    <Accordion.Root
      onValueChange={onChange}
      defaultValue={[defaultValue]}
      collapsible
    >
      {children}
    </Accordion.Root>
  );
}
