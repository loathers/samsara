type Props = {
  date: string | Date;
};

const dateFormatter = Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
});

export function ShowDate({ date }: Props) {
  const d = new Date(date);

  return (
    <time dateTime={d.toDateString()} suppressHydrationWarning={true}>
      {dateFormatter.format(d)}
    </time>
  );
}
