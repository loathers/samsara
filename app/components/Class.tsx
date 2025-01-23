import { Text } from "@chakra-ui/react";

import { ClassIcon } from "~/components/ClassIcon";

type SymbolsProps = {
  class: { name: string; image: string | null };
  shorten: "full-symbols" | "symbols";
};

type TextProps = {
  class: { name: string };
  shorten: "acronyms" | undefined;
};

type Props = SymbolsProps | TextProps;

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
  return acronym.length === 1 ? name.slice(0, 2) : acronym;
}

export function Class({ class: clazz, shorten }: Props) {
  if (shorten === "symbols") {
    return <ClassIcon class={clazz} />;
  }

  const name = formatClassName(clazz);

  if (shorten === "acronyms") {
    return <Text title={name}>{getClassAcronym(name)}</Text>;
  }

  return name;
}
