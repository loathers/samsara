import { TagType } from "@prisma/client";
import { json, LoaderFunctionArgs } from "@remix-run/node";

import { db } from "~/db.server";

const isTagType = (input?: string): input is TagType => {
  if (!input) return false;
  return /(LEADERBOARD|PYRITE)(_SPECIAL)?/i.test(input);
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  let { slug, tagType } = params;

  slug = slug?.toLowerCase();
  tagType = tagType?.toUpperCase();

  if (!isTagType(tagType))
    throw json({ message: "Invalid tag type" }, { status: 400 });

  const path = await db.path.findFirst({
    where: { OR: [{ slug }, { id: Number(slug) }] },
    include: {
      class: {
        select: { name: true, id: true },
      },
    },
  });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  const leaderboards = Object.fromEntries(
    await Promise.all(
      ["HARDCORE" as const, "SOFTCORE" as const].map(
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

  return json(leaderboards);
};
