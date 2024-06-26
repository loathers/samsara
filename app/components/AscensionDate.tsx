import { ClientOnly } from "remix-utils/client-only";

type Props = {
  date: string | Date;
};

const localeDateFormatter = Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
});
const ukDateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "short",
});

export function AscensionDate({ date }: Props) {
  const d = new Date(date);

  return (
    <ClientOnly fallback={ukDateFormatter.format(d)}>
      {() => localeDateFormatter.format(d)}
    </ClientOnly>
  );
}
