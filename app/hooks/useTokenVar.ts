import { useChakraContext } from "@chakra-ui/react";

/**
 * Chakra's own useToken flattens a semantic token down to one condition's
 * value, so `bg` always comes back as the dark colour whatever the current
 * theme. These are CSS variable references instead, which the browser resolves
 * per theme — necessary wherever a token has to be handed to something that
 * takes a colour string, like a recharts prop or an SVG fill.
 */
export function useTokenVar(category: string, tokens: string[]) {
  const system = useChakraContext();
  return tokens.map((token) => system.token.var(`${category}.${token}`));
}
