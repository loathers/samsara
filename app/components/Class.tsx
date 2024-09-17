import { ShortenStyle } from "~/utils";
import { Text } from "@chakra-ui/react";
import { ClassIcon } from "./ClassIcon";

type Props = {
  class: { name: string; image: string | null };
  shorten?: ShortenStyle;
};

export function formatClassName(clazz?: { name: string }) {
  if (!clazz) return "Unknown";
  return clazz.name;
}

function getClassAcronym(name: string) {
  switch (name) {
    case "Actually Ed the Undying":
      return "Ed";
    case "Beanslinger":
      return "BS";
  }

  const acronym = name
    .split(/[ -]/)
    .map((word) => (parseInt(word) ? word : word[0]))
    .join("");
  return acronym.length === 1 ? name.slice(0, 2).toUpperCase() : acronym;
}

export function Class({ class: clazz, shorten }: Props) {
  const name = formatClassName(clazz);

  if (shorten === "acronyms") {
    return <Text title={name}>{getClassAcronym(name)}</Text>;
  }

  if (shorten === "symbols") {
    return <ClassIcon class={clazz} />;
  }

  return name;
}
