import { Text } from "@chakra-ui/react";

import { PathIcon } from "~/components/PathIcon";
import { ShortenStyle } from "~/utils";

type Props = {
  path: { name: string; image: string | null };
  shorten?: ShortenStyle;
};

export function formatPathName(path?: { name: string }) {
  if (!path) return "Unknown";
  if (path.name === "None") return "No Path";
  return path.name;
}

export function getPathAcronym(name: string) {
  switch (name) {
    case "Actually Ed the Undying":
      return "Ed";
    case "A Shrunken Adventurer am I":
      return "Smol";
    case "Standard":
      return "Std";
    case "Path of the Plumber":
      return "PP";
    case "Class Act II":
      return "CA2";
    case "Wildfire":
      return "WF";
  }

  const parts = name.replace("-", " ").split(" ");

  if (parts.length === 1) {
    const caps = [...name].filter((c) => c === c.toUpperCase());
    if (caps.length > 1) return caps.join("");
  }

  const acronym = parts
    .map((word) => (parseInt(word) ? word : word[0]))
    .join("");

  return acronym.length === 1 ? name.slice(0, 3) : acronym;
}

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
