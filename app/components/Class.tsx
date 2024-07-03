import { ShortenStyle } from "~/utils";
import { ClassIcon } from "./ClassIcon";

type Props = {
  class: { name: string; image: string | null };
  shorten?: ShortenStyle;
};

export function formatClassName(clazz?: { name: string }) {
  if (!clazz) return "Unknown";
  return clazz.name;
}

export function Class({ class: clazz, shorten }: Props) {
  const name = formatClassName(clazz);

  if (shorten === "acronyms") {
    switch (name) {
      case "Actually Ed the Undying":
        return "Ed";
    }

    const acronym = name
      .replace("-", " ")
      .split(" ")
      .map((word) => (parseInt(word) ? word : word[0]))
      .join("");
    return acronym.length === 1 ? name.slice(0, 2).toUpperCase() : acronym;
  }

  if (shorten === "symbols") {
    return <ClassIcon class={clazz} />;
  }

  return name;
}
