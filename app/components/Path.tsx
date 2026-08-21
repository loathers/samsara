import { Text } from "@chakra-ui/react";

import { PathIcon } from "~/components/PathIcon";
import { ShortenStyle, formatPathName, getPathAcronym } from "~/utils";

type Props = {
  path: { name: string; image: string | null };
  shorten?: ShortenStyle;
  title?: string;
};

export function Path({ path, shorten, title }: Props) {
  const name = formatPathName(path);

  switch (shorten) {
    case "acronyms":
      return (
        <Text as="span" title={title ?? name}>
          {getPathAcronym(name)}
        </Text>
      );
    case "symbols":
      return <PathIcon path={path} title={title} />;
    case "full-symbols":
      return (
        <>
          <PathIcon path={path} title={title} />
          {name}
        </>
      );
  }

  return name;
}
