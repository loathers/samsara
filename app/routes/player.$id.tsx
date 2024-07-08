import { Heading, Stack, Button, ButtonGroup, Box } from "@chakra-ui/react";
import { json, unstable_defineLoader as defineLoader } from "@remix-run/node";
import {
  MetaArgs_SingleFetch,
  redirect,
  useLoaderData,
  Link as RemixLink,
} from "@remix-run/react";

import { db } from "../db.server.js";

import { numberFormatter } from "~/utils.js";
import { FrequencyGraph } from "~/components/FrequencyGraph";
import { PlayerTable } from "~/components/PlayerTable";

export const loader = defineLoader(async ({ params }) => {
  const { id } = params;

  if (id && isNaN(parseInt(id))) {
    const found = await db.player.findFirst({
      where: { name: { mode: "insensitive", equals: id } },
    });

    if (found) throw redirect(`/player/${found.id}`);
    throw json({ message: "Invalid player name" }, { status: 400 });
  }

  if (!id) throw json({ message: "Invalid player ID" }, { status: 400 });

  const player = await db.player.findUnique({
    where: { id: parseInt(id) },
    include: {
      ascensions: {
        include: { path: true, class: true, tags: true },
        orderBy: { ascensionNumber: "asc" },
      },
    },
  });

  if (!player) throw json({ message: "Player not found" }, { status: 404 });

  const frequency = await db.ascension.getFrequency({ player });

  return { player, frequency };
});

export const meta = ({ data }: MetaArgs_SingleFetch<typeof loader>) => {
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

export type RowData = Awaited<
  ReturnType<typeof loader>
>["player"]["ascensions"][number];

export default function Player() {
  const { player, frequency } = useLoaderData<typeof loader>()!;

  return (
    <Stack spacing={10}>
      <Stack spacing={4}>
        <Heading alignSelf="center">
          {player.name} (#{player.id})
        </Heading>
        <ButtonGroup justifyContent="center">
          <Button as={RemixLink} leftIcon={<span>←</span>} to="/">
            home
          </Button>
        </ButtonGroup>
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
      <PlayerTable ascensions={player.ascensions} />
    </Stack>
  );
}
