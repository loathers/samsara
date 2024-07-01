import {
  Card,
  CardBody,
  Stat,
  StatArrow,
  StatHelpText,
  StatLabel,
  StatNumber,
} from "@chakra-ui/react";

type Props = {
  current: number;
  change: number;
  children: React.ReactNode;
};

export function CoolStat({ current, children, change }: Props) {
  return (
    <Card>
      <CardBody>
        <Stat>
          <StatLabel>{children}</StatLabel>
          <StatNumber>{current}</StatNumber>
          <StatHelpText>
            {change === 0 ? (
              "No change"
            ) : (
              <>
                <StatArrow type={change > 0 ? "increase" : "decrease"} />
                {(Math.abs(change) * 100).toFixed(1)}% on previous week
              </>
            )}
          </StatHelpText>
        </Stat>
      </CardBody>
    </Card>
  );
}
