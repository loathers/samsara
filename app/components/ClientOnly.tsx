import { ReactNode } from "react";

import { useIsHydrated } from "~/hooks/useIsHydrated";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function ClientOnly({ children, fallback = null }: Props) {
  return useIsHydrated() ? children : fallback;
}
