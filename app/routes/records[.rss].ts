import { Feed } from "feed";
import { data } from "react-router";

import { formatLifestyle } from "~/components/Lifestyle";
import { db, getMaxAge } from "~/db.server";
import { hasExtra } from "~/utils";

export const loader = async () => {
  const headers = {
    "Cache-Control": `public, max-age=${await getMaxAge()}`,
    "Content-Type": "application/rss+xml",
  };

  const records = await db.ascension.findMany({
    select: {
      path: { select: { name: true } },
      days: true,
      turns: true,
      date: true,
      lifestyle: true,
      extra: true,
      player: { select: { name: true, id: true } },
      ascensionNumber: true,
    },
    where: {
      tags: { some: { type: "RECORD_BREAKING" } },
    },
    orderBy: [{ date: "desc" }],
  });

  const feed = new Feed({
    title: "Record-Breaking Ascensions",
    description:
      "The latest record-breaking ascensions in Kingdom of Loathing, brought to you by Samsara.",
    id: "https://samsara.loathers.net/records.rss",
    link: "https://samsara.loathers.net/",
    copyright: "none",
    updated: records[0].date,
  });

  records.forEach((record) => {
    const score = hasExtra(record)
      ? Object.entries(record.extra)
          .map(([key, value]) => `${value} ${key}`)
          .join(", ")
      : `${record.turns}/${record.days}`;
    const description = `${record.player.name} (#${record.player.id}) has achieved the best ${formatLifestyle(record.lifestyle)} ${record.path.name} with ${score}`;
    feed.addItem({
      title: description,
      id: `https://samsara.loathers.net/player/${record.player.id}#${record.ascensionNumber}`,
      link: `https://samsara.loathers.net/player/${record.player.id}#${record.ascensionNumber}`,
      content: description,
      date: record.date,
    });
  });

  return data(feed.rss2(), { headers });
};
