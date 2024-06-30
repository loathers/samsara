import { Link, Text } from "@chakra-ui/react";
import { Link as RemixLink } from "@remix-run/react";
import { Lifestyle, Path as PathType } from "@prisma/client";

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
  ascension: { lifestyle: Lifestyle };
  path: PathType;
};

export function PathLink({ ascension: { lifestyle }, path }: Props) {
  if (lifestyle === "CASUAL") return <Text>{formatLifestyle(lifestyle)}</Text>;
  return (
    <Link as={RemixLink} to={`/path/${path.slug}`}>
      {formatLifestyle(lifestyle)} {formatPath(path.name)}
    </Link>
  );
}
