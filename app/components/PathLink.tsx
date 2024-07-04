import { Link, Stack } from "@chakra-ui/react";
import { Link as RemixLink } from "@remix-run/react";
import { Lifestyle as LifestyleEnum } from "@prisma/client";
import { ShortenStyle } from "~/utils";
import { formatLifestyle, Lifestyle } from "./Lifestyle";
import { formatPathName, Path } from "./Path";

type Props = {
  lifestyle?: LifestyleEnum;
  path: { slug: string; name: string; image: string | null };
  shorten?: ShortenStyle;
};

export function PathLink({ lifestyle, path, shorten }: Props) {
  const title = `${lifestyle ? `${formatLifestyle(lifestyle)} ` : ""}${formatPathName(path)}`;

  const child = (
    <>
      {lifestyle && <Lifestyle lifestyle={lifestyle} shorten={shorten} />}
      <Path path={path} shorten={shorten} />
    </>
  );

  return (
    <Link as={RemixLink} to={`/path/${path.slug}`} title={title}>
      {shorten === "symbols" ? (
        <Stack
          spacing={shorten ? 0 : 1}
          justifyContent="end"
          direction={lifestyle === "CASUAL" ? "row-reverse" : "row"}
        >
          {child}
        </Stack>
      ) : (
        child
      )}
    </Link>
  );
}
