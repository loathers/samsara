import { slugify } from "scripts/utils/utils";

import { db } from "~/db.server";

await db.$transaction(async (tx) => {
  const paths = await tx.ascension.findMany({
    select: { pathName: true },
    distinct: ["pathName"],
  });

  await tx.path.createMany({
    data: paths.map((a) => ({
      name: a.pathName,
      slug: slugify(a.pathName),
    })),
    skipDuplicates: true,
  });
});
