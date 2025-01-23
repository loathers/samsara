import { updateClasses } from "scripts/utils/client";

import { db } from "~/db.server";

await db.$transaction(async (tx) => {
  const paths = await tx.ascension.findMany({
    select: { className: true },
    distinct: ["className"],
  });

  await tx.class.createMany({
    data: paths.map((a) => ({
      name: a.className,
    })),
    skipDuplicates: true,
  });
});

await updateClasses();
