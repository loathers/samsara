import { HStack, Link } from "@chakra-ui/react";
import { Lifestyle as LifestyleEnum } from "@prisma/client";
import { Link as RRLink } from "react-router";

import { Lifestyle, formatLifestyle } from "~/components/Lifestyle";
import { Path } from "~/components/Path";
import { formatPathName, ShortenStyle } from "~/utils";

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
      <RRLink to={`/path/${path.slug}`} title={title}>
        {["symbols", "full-symbols"].includes(shorten!) ? (
          <HStack minWidth={15} gap={shorten === "symbols" ? 0 : 1}>
            {child}
          </HStack>
        ) : (
          child
        )}
      </RRLink>
    </Link>
  );
}
