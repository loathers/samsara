import { Box, Button, Group, Heading, Stack } from "@chakra-ui/react";
import {
  type LoaderFunctionArgs,
  type MetaArgs,
  Link as RRLink,
  data,
  redirect,
  useLoaderData,
  useLocation,
} from "react-router";

import { FrequencyGraph } from "~/components/FrequencyGraph";
import { PlayerTable } from "~/components/PlayerTable";
import {
  findPlayerByName,
  findPlayerWithAscensions,
  getFrequency,
} from "../db.server.js";
import { numberFormatter } from "~/utils.js";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { id } = params;

  if (id && isNaN(parseInt(id))) {
    const found = await findPlayerByName(id);

    if (found) throw redirect(`/player/${found.id}`);
    throw data({ message: "Invalid player name" }, { status: 400 });
  }

  if (!id) throw data({ message: "Invalid player ID" }, { status: 400 });

  const player = await findPlayerWithAscensions(parseInt(id));

  if (!player) throw data({ message: "Player not found" }, { status: 404 });

  const frequency = await getFrequency({ player });

  return { player, frequency };
};

export const meta = ({ data }: MetaArgs<typeof loader>) => {
  return [
    { title: data && `Saṃsāra - ${data.player.name} (#${data.player.id})` },
    {
      name: "description",
      content:
        data &&
        `Ascension stats for ${data.player.name}'s ${numberFormatter.format(data.player.ascensions.length)} runs`,
    },
  ];
};

type PlayerWithAscensions = NonNullable<
  Awaited<ReturnType<typeof findPlayerWithAscensions>>
>;
export type RowData = PlayerWithAscensions["ascensions"][number];

export default function Player() {
  const { hash } = useLocation();
  const { player, frequency } = useLoaderData<typeof loader>()!;

  const jumpTo = hash && /#\d+/.test(hash) ? Number(hash.slice(1)) : undefined;

  return (
    <Stack gap={10}>
      <Stack gap={4}>
        <Heading size="4xl" alignSelf="center">
          {player.name} (#{player.id})
        </Heading>
        <Group justifyContent="center">
          <Button asChild>
            <RRLink to="/">home</RRLink>
          </Button>
        </Group>
      </Stack>
      <Box
        textAlign="center"
        mt={8}
        height={150}
        width="100%"
        alignSelf="center"
      >
        <FrequencyGraph data={frequency} untilNow />
      </Box>
      <PlayerTable ascensions={player.ascensions} jumpTo={jumpTo} />
    </Stack>
  );
}
