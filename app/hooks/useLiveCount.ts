import { useEffect, useRef, useState } from "react";

import type { CountSnapshot } from "~/db.server";

// `nextUpdateMs` is routinely already past, which would mean a request every frame.
const MIN_POLL_MS = 30_000;

function project(
  { totalTracked, ascensionsPerSecond, takenAtMs }: CountSnapshot,
  now: number,
) {
  const elapsedSeconds = Math.max(0, now - takenAtMs) / 1000;
  return totalTracked + Math.floor(elapsedSeconds * ascensionsPerSecond);
}

/**
 * Batches land half an hour apart, so we tick up at the recent average rate
 * between them and reconcile when one arrives.
 *
 * An overshoot is held, never wound back. Reconciling reprojects from the true
 * figure, so error stays within one batch's drift.
 */
export function useLiveCount(initial: CountSnapshot) {
  // Starts at the server's figure so the first paint matches SSR.
  const [count, setCount] = useState(initial.totalTracked);

  const snapshot = useRef(initial);

  useEffect(() => {
    let cancelled = false;
    let tick: ReturnType<typeof setTimeout> | undefined;
    let poll: ReturnType<typeof setTimeout> | undefined;

    // Tracked here so scheduling stays out of a setState updater.
    let shown = initial.totalTracked;

    const advance = () => {
      if (cancelled) return;

      shown = Math.max(shown, project(snapshot.current, Date.now()));
      setCount(shown);

      const { totalTracked, ascensionsPerSecond, takenAtMs } = snapshot.current;
      if (ascensionsPerSecond <= 0) return;

      const nextWholeAscensionAt =
        takenAtMs + ((shown + 1 - totalTracked) / ascensionsPerSecond) * 1000;
      tick = setTimeout(
        advance,
        Math.max(0, nextWholeAscensionAt - Date.now()),
      );
    };

    // Without jitter, every open tab wakes into the same second.
    const pollDelay = () =>
      Math.max(MIN_POLL_MS, snapshot.current.nextUpdateMs - Date.now()) +
      Math.random() * MIN_POLL_MS;

    const reconcile = async () => {
      if (cancelled) return;

      if (!document.hidden) {
        try {
          const response = await fetch("/api/count");
          if (!response.ok)
            throw new Error(`Unexpected status ${response.status}`);

          const fresh: CountSnapshot = await response.json();
          if (cancelled) return;

          snapshot.current = fresh;
          clearTimeout(tick);
          advance();
        } catch {
          // A late batch and a network blip look the same here.
        }
      }

      poll = setTimeout(reconcile, pollDelay());
    };

    const onVisible = () => {
      if (document.hidden || Date.now() < snapshot.current.nextUpdateMs) return;
      clearTimeout(poll);
      reconcile();
    };

    advance();
    poll = setTimeout(reconcile, pollDelay());
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearTimeout(tick);
      clearTimeout(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return count;
}
