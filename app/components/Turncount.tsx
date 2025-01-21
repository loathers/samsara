import { Text } from "@chakra-ui/react";
import { numberFormatter } from "~/utils";

type Props = {
  days: number;
  turns: number;
};

export function Turncount({ days, turns }: Props) {
  const formattedTurns = numberFormatter.format(turns);
  const fullTurncount = `${numberFormatter.format(days)} / ${formattedTurns}`;

  if (days < 365) {
    return <Text>{fullTurncount}</Text>;
  }

  const years = (days / 365.25).toFixed(1).replace(/\.0$/, "");

  return (
    <Text title={fullTurncount}>
      {years} years / {formattedTurns}
    </Text>
  );
}
