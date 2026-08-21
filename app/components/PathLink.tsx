import { HStack, Link } from "@chakra-ui/react";
import { JsonValue, Lifestyle as LifestyleEnum } from "~/db";
import { Link as RRLink } from "react-router";

import { Lifestyle, formatLifestyle } from "~/components/Lifestyle";
import { Path } from "~/components/Path";
import { ShortenStyle, formatExtra, formatPathName } from "~/utils";

type Props = {
  lifestyle?: LifestyleEnum;
  path: { slug: string; name: string; image: string | null };
  shorten?: ShortenStyle;
  extra?: JsonValue;
};

export function PathLink({ lifestyle, path, shorten, extra }: Props) {
  const formattedExtra = extra === undefined ? "" : formatExtra(extra);
  const title = `${lifestyle ? `${formatLifestyle(lifestyle)} ` : ""}${formatPathName(path)}${formattedExtra && ` (${formattedExtra})`}`;

  const child = (
    <>
      {lifestyle && <Lifestyle lifestyle={lifestyle} shorten={shorten} />}
      <Path path={path} shorten={shorten} title={title} />
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
