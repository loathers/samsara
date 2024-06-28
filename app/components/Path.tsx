import { Link, Text } from "@chakra-ui/react";
import { Link as RemixLink } from "@remix-run/react";
import { Lifestyle } from "@prisma/client";

const formatPath = (path: string) => {
  switch (path) {
    case "None":
      return "No Path";
    default:
      return path;
  }
};

const formatLifestyle = (lifestyle: Lifestyle) => {
  return lifestyle.charAt(0) + lifestyle.slice(1).toLowerCase();
};

type Props = {
  ascension: { path: string; lifestyle: Lifestyle; pathSlug: string };
};

export function Path({ ascension: { path, lifestyle, pathSlug } }: Props) {
  if (lifestyle === "CASUAL") return <Text>{formatLifestyle(lifestyle)}</Text>;
  return (
    <Link as={RemixLink} to={`/path/${pathSlug}`}>
      {formatLifestyle(lifestyle)} {formatPath(path)}
    </Link>
  );
}
