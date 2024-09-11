import { useMemo } from "react";
import { fullDateFormatter } from "~/utils";

type Props = {
  date: Date | string;
};

export function FormattedDate({ date }: Props) {
  const d = useMemo(
    () => (date instanceof Date ? date : new Date(date)),
    [date],
  );
  return (
    <time dateTime={d.toDateString()} suppressHydrationWarning={true}>
      {fullDateFormatter.format(d)}
    </time>
  );
}
