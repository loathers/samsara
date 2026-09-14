import { data } from "react-router";

import { getCountSnapshot, getMaxAge } from "~/db.server";

export const loader = async () => {
  const [snapshot, maxAge] = await Promise.all([
    getCountSnapshot(),
    getMaxAge(),
  ]);

  return data(snapshot, {
    // getMaxAge returns 0 whenever the scanner is overdue.
    headers: { "Cache-Control": `public, max-age=${Math.max(30, maxAge)}` },
  });
};
