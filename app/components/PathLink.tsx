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

const formatLifestyle = (lifestyle: Lifestyle, shorten: boolean) => {
  switch (lifestyle) {
    case "HARDCORE":
      return shorten ? "HC" : "Hardcore";
    case "SOFTCORE":
      return shorten ? "SC" : "Softcore";
    case "CASUAL":
      return shorten ? "C" : "Casual";
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
