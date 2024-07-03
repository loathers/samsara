import { ShortenStyle } from "~/utils";
import { PathIcon } from "./PathIcon";

type Props = {
  path: { name: string; image: string | null };
  shorten?: ShortenStyle;
};

export function formatPathName(path?: { name: string }) {
  if (!path) return "Unknown";
  if (path.name === "None") return "No Path";
  return path.name;
}

export function Path({ path, shorten }: Props) {
  const name = formatPathName(path);

  if (shorten === "acronyms") {
    switch (name) {
      case "Actually Ed the Undying":
        return "Ed";
      case "A Shrunken Adventurer am I":
        return "Smol";
    }

    const acronym = name
      .replace("-", " ")
      .split(" ")
      .map((word) => (parseInt(word) ? word : word[0]))
      .join("");
    return acronym.length === 1 ? name.slice(0, 3) : acronym;
  }

  if (shorten === "symbols") {
    return <PathIcon path={path} />;
  }

  return name;
}
