import { Text } from "@chakra-ui/react";
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
  path: string;
  lifestyle: Lifestyle;
};

export function Path({ path, lifestyle }: Props) {
  if (lifestyle === "CASUAL") return <Text>{formatLifestyle(lifestyle)}</Text>;
  return (
    <Text>
      {formatLifestyle(lifestyle)} {formatPath(path)}
    </Text>
  );
}
