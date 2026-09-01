import { Feed } from "feed";
import { data } from "react-router";

import { findBoard } from "~/boards";
import { formatLifestyle } from "~/components/Lifestyle";
import { getMaxAge, getRecordsForRSS } from "~/db.server";
import { SPECIAL_RANKINGS, hasExtra } from "~/utils";

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
    id: "https://samsara.loathers.net/records.rss",
    link: "https://samsara.loathers.net/",
    copyright: "none",
    updated: records[0].date,
  });

  records.forEach((record) => {
    // Only quote a score from extra where the path is actually ranked on it — otherwise
    // incidental metadata like Blue vs. Red's team would stand in for days and turns.
    const rankedOn = SPECIAL_RANKINGS.get(record.path.name);
    const score =
      rankedOn && hasExtra(record)
        ? `${record.extra[rankedOn]} ${rankedOn}`
        : `${record.turns}/${record.days}`;

    const board = findBoard(record.path.name, record.board);
    const path = board ? `${record.path.name} (${board.label})` : record.path.name;

    const description = `${record.player.name} (#${record.player.id}) has achieved the best ${formatLifestyle(record.lifestyle)} ${path} with ${score}`;
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
