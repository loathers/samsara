import { Badge, Card, Stat } from "@chakra-ui/react";

type Props = {
  current: number;
  change: number;
  children: React.ReactNode;
};

export function CoolStat({ current, children, change }: Props) {
  return (
    <Card.Root>
      <Card.Body>
        <Stat.Root>
          <Stat.Label>{children}</Stat.Label>
          <Stat.ValueText>{current}</Stat.ValueText>
          <Stat.HelpText>
            <Badge
              colorPalette={
                change === 0 ? "gray" : change > 0 ? "green" : "red"
              }
              gap={0}
            >
              {change === 0 ? (
                "No change"
              ) : (
                <>
                  {change > 0 ? <Stat.UpIndicator /> : <Stat.DownIndicator />}
                  {(Math.abs(change) * 100).toFixed(1)}% on previous week
                </>
              )}
            </Badge>
          </Stat.HelpText>
        </Stat.Root>
      </Card.Body>
    </Card.Root>
  );
}
