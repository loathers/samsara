import { Feed } from "feed";
import { data } from "react-router";

import { findBoard } from "~/boards";
import { formatLifestyle } from "~/components/Lifestyle";
import { getMaxAge, getRecordsForRSS } from "~/db.server";
import { SITE_URL, hasExtra } from "~/utils";

export const loader = async () => {
  const headers = {
    "Cache-Control": `public, max-age=${await getMaxAge()}`,
    "Content-Type": "application/rss+xml",
  };

  const records = await getRecordsForRSS();

  const feed = new Feed({
    title: "Record-Breaking Ascensions",
    description:
      "The latest record-breaking ascensions in Kingdom of Loathing, brought to you by Samsara.",
    id: `${SITE_URL}/records.rss`,
    link: `${SITE_URL}/`,
    copyright: "none",
    updated: records[0].date,
  });

  records.forEach((record) => {
    const board = findBoard(record.path.name, record.board);

    // Otherwise metadata like Blue vs. Red's team stands in for days and turns.
    const rankedOn = board?.extra?.key;
    const score =
      rankedOn && hasExtra(record)
        ? `${record.extra[rankedOn]} ${rankedOn}`
        : `${record.turns}/${record.days}`;

    const path = board?.label
      ? `${record.path.name} (${board.label})`
      : record.path.name;

    const description = `${record.player.name} (#${record.player.id}) has achieved the best ${formatLifestyle(record.lifestyle)} ${path} with ${score}`;
    feed.addItem({
      title: description,
      id: `${SITE_URL}/player/${record.player.id}#${record.ascensionNumber}`,
      link: `${SITE_URL}/player/${record.player.id}#${record.ascensionNumber}`,
      content: description,
      date: record.date,
    });
  });

  return data(feed.rss2(), { headers });
};
