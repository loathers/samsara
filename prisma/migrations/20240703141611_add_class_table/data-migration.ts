import { updateClasses } from "scripts/utils/client";
import { db } from "~/db.server";

await db.$transaction(async (tx) => {
  const paths = await tx.ascension.findMany({
    select: { class: true },
    where: { abandoned: false },
    distinct: ["class"],
  });

  await tx.class.createMany({
    data: paths.map((a) => ({
      name: a.class,
    })),
    skipDuplicates: true,
  });
});

await updateClasses();
