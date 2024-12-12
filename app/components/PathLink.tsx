import { HStack, Link } from "@chakra-ui/react";
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
    <Link asChild gap={0}>
      <RemixLink to={`/path/${path.slug}`} title={title}>
        {["symbols", "full-symbols"].includes(shorten!) ? (
          <HStack minWidth={15} gap={shorten === "symbols" ? 0 : 1}>
            {child}
          </HStack>
        ) : (
          child
        )}
      </RemixLink>
    </Link>
  );
}
