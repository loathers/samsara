import { useEffect, useState } from "react";

import type { CountSnapshot } from "~/db.server";

const MIN_POLL_MS = 30_000;

// A timer firing a hair early would project the same count and stall the clock,
// which only restarts when `count` changes.
const TIMER_SLACK_MS = 50;

function project(
  { totalTracked, ascensionsPerSecond, takenAtMs }: CountSnapshot,
  now: number,
) {
  const elapsedSeconds = Math.max(0, now - takenAtMs) / 1000;
  return totalTracked + Math.floor(elapsedSeconds * ascensionsPerSecond);
}

function msUntilNextIncrement(snapshot: CountSnapshot, shown: number) {
  const { totalTracked, ascensionsPerSecond, takenAtMs } = snapshot;
  if (ascensionsPerSecond <= 0) return null;

  const at =
    takenAtMs + ((shown + 1 - totalTracked) / ascensionsPerSecond) * 1000;
  return Math.max(0, at - Date.now()) + TIMER_SLACK_MS;
}

/**
 * Batches land half an hour apart, so we tick up at the recent average rate
 * between them and reconcile when one arrives.
 *
 * An overshoot is held, never wound back. Reconciling reprojects from the true
 * figure, so error stays within one batch's drift.
 */
export function useLiveCount(initial: CountSnapshot) {
  const [snapshot, setSnapshot] = useState(initial);
  // Starts at the server's figure so the first paint matches SSR.
  const [count, setCount] = useState(initial.totalTracked);

  // Each count schedules the wake-up for the one after it, and a fresh snapshot
  // reschedules from the new baseline.
  useEffect(() => {
    const delay = msUntilNextIncrement(snapshot, count);
    if (delay === null) return;

    const timer = setTimeout(
      () => setCount((shown) => Math.max(shown, project(snapshot, Date.now()))),
      delay,
    );

    return () => clearTimeout(timer);
  }, [snapshot, count]);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let latest = initial;

    const schedule = () => {
      if (controller.signal.aborted) return;

      // Without jitter, every open tab wakes into the same second.
      const due = Math.max(MIN_POLL_MS, latest.nextUpdateMs - Date.now());
      timer = setTimeout(poll, due + Math.random() * MIN_POLL_MS);
    };

    const poll = async () => {
      if (!document.hidden) {
        try {
          const response = await fetch("/api/count", {
            signal: controller.signal,
          });
          if (!response.ok)
            throw new Error(`Unexpected status ${response.status}`);

          latest = await response.json();
          setSnapshot(latest);
        } catch {
          // A late batch and a network blip look the same here.
        }
      }

      schedule();
    };

    const onVisible = () => {
      if (document.hidden || Date.now() < latest.nextUpdateMs) return;
      clearTimeout(timer);
      poll();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      controller.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return count;
}
