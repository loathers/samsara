import { slugify } from "scripts/utils/utils";
import { db } from "~/db.server";

await db.$transaction(async () => {
  const paths = await db.ascension.findMany({
    select: { pathName: true },
    distinct: ["pathName"],
  });

  await db.path.createMany({
    data: paths.map((a) => ({
      name: a.pathName,
      slug: slugify(a.pathName),
    })),
    skipDuplicates: true,
  });
});
