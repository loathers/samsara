import { useLocation, useNavigate } from "@remix-run/react";
import { useCallback } from "react";

export function useAccordionNavigation(items: string[]) {
  const { hash } = useLocation();
  const navigate = useNavigate();

  const defaultIndex = items.indexOf(hash.slice(1));
  const onChange = useCallback(
    (index: number) => {
      navigate({ hash: index >= 0 ? items[index] : undefined });
    },
    [items, navigate],
  );

  return { defaultIndex, onChange };
}
