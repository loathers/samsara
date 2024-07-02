import { Link, Text } from "@chakra-ui/react";
import { Link as RemixLink } from "@remix-run/react";
import { Lifestyle } from "@prisma/client";
import { formatLifestyle } from "~/utils";

const formatPath = (path: string) => {
  switch (path) {
    case "None":
      return "No Path";
    default:
      return path;
  }
};

type Props = {
  lifestyle?: Lifestyle;
  path: { slug: string; name: string };
  shorten?: boolean;
};

export function PathLink({ lifestyle, path, shorten = false }: Props) {
  if (lifestyle === "CASUAL")
    return <Text>{formatLifestyle(lifestyle, shorten)}</Text>;

  const text = `${lifestyle ? `${formatLifestyle(lifestyle, shorten)} ` : ""} ${formatPath(path.name)}`;

  return (
    <Link as={RemixLink} to={`/path/${path.slug}`}>
      {text}
    </Link>
  );
}
