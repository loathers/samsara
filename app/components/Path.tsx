import { Text } from "@chakra-ui/react";

import { PathIcon } from "~/components/PathIcon";
import { ShortenStyle, formatPathName, getPathAcronym } from "~/utils";

type Props = {
  path: { name: string; image: string | null };
  shorten?: ShortenStyle;
};

export function Path({ path, shorten }: Props) {
  const name = formatPathName(path);

  switch (shorten) {
    case "acronyms":
      return (
        <Text as="span" title={name}>
          {getPathAcronym(name)}
        </Text>
      );
    case "symbols":
      return <PathIcon path={path} />;
    case "full-symbols":
      return (
        <>
          <PathIcon path={path} />
          {name}
        </>
      );
  }

  return name;
}
