import { fullDateFormatter } from "~/utils";

type Props = {
  date: Date;
};

export function FormattedDate({ date }: Props) {
  return (
    <time dateTime={date.toDateString()} suppressHydrationWarning={true}>
      {fullDateFormatter.format(date)}
    </time>
  );
}
