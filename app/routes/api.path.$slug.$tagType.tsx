import { Lifestyle, TagType } from "@prisma/client";
import { type LoaderFunctionArgs, data, redirect } from "react-router";

import { db, getMaxAge } from "~/db.server";

const isTagType = (input?: string): input is TagType => {
  if (!input) return false;
  return /(LEADERBOARD|PYRITE)(_SPECIAL)?/i.test(input);
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  let { slug, tagType } = params;

  slug = slug?.toLowerCase();
  tagType = tagType?.toUpperCase();

  const headers = {
    "Cache-Control": `public, max-age=${await getMaxAge()}`,
  };

  if (!isTagType(tagType))
    throw data({ message: "Invalid tag type" }, { status: 400, headers });

  const id = Number.isNaN(Number(slug)) ? undefined : Number(slug);
  const path = await db.path.findFirst({
    where: { OR: [{ slug }, { id }] },
  });

  if (!path)
    throw data({ message: "Invalid path name" }, { status: 400, headers });

  if (slug !== String(path.id)) {
    throw redirect(`/api/path/${path.id}/${tagType.toLowerCase()}`);
  }

  const leaderboards = Object.fromEntries(
    await Promise.all(
      Object.values(Lifestyle).map(
        async (lifestyle) =>
          [
            lifestyle,
            await db.ascension.getLeaderboard({
              path,
              lifestyle,
              type: tagType,
            }),
          ] as const,
      ),
    ),
  );

  return data(leaderboards, { headers });
};
