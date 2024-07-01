type Props = {
  date: Date;
};

const dateFormatter = Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
});

export function FormattedDate({ date }: Props) {
  return (
    <time dateTime={date.toDateString()} suppressHydrationWarning={true}>
      {dateFormatter.format(date)}
    </time>
  );
}
