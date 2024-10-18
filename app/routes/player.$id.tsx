import { Heading, Stack, Button, ButtonGroup, Box } from "@chakra-ui/react";
import { json, LoaderFunctionArgs, data } from "@remix-run/node";
import {
  MetaArgs,
  redirect,
  useLoaderData,
  Link as RemixLink,
  useLocation,
} from "@remix-run/react";

import { db } from "../db.server.js";

import { compareDaycount, numberFormatter } from "~/utils.js";
import { FrequencyGraph } from "~/components/FrequencyGraph";
import { PlayerTable } from "~/components/PlayerTable";
import { Ascension, Class, Lifestyle, Path, Tag } from "@prisma/client";
import { PlayerStats } from "~/components/PlayerStats";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { id } = params;

  if (id && isNaN(parseInt(id))) {
    const found = await db.player.findFirst({
      where: { name: { mode: "insensitive", equals: id } },
    });

    if (found) throw redirect(`/player/${found.id}`);
    throw data({ message: "Invalid player name" }, { status: 400 });
  }

  if (!id) throw data({ message: "Invalid player ID" }, { status: 400 });

  const player = await db.player.findUnique({
    where: { id: parseInt(id) },
    include: {
      ascensions: {
        include: {
          path: { select: { slug: true, name: true, image: true } },
          class: { select: { name: true, image: true } },
          tags: { select: { type: true, value: true, year: true } },
        },
        orderBy: { ascensionNumber: "asc" },
      },
    },
  });

  if (!player) throw data({ message: "Player not found" }, { status: 404 });

  const frequency = await db.ascension.getFrequency({ player });

  const stats = player.ascensions.reduce<
    Record<
      string,
      {
        runs: number;
        best: [softcore: Ascension | null, hardcore: Ascension | null];
      }
    >
  >((acc, a) => {
    if (!acc[a.path.name]) acc[a.path.name] = { runs: 0, best: [null, null] };
    const [softcore, hardcore] = acc[a.path.name].best;

    acc[a.path.name].runs += 1;

    switch (a.lifestyle) {
      case Lifestyle.SOFTCORE:
        if (!softcore || compareDaycount(a, softcore)) {
          acc[a.path.name].best[0] = a;
        }
        break;
      case Lifestyle.HARDCORE:
        if (!hardcore || compareDaycount(a, hardcore) < 0) {
          acc[a.path.name].best[1] = a;
        }
        break;
    }

    return acc;
  }, {});

  return json({ player, frequency, stats });
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

export type RowData = Omit<Ascension, "date"> & {
  date: string;
  path: Pick<Path, "slug" | "name" | "image">;
  class: Pick<Class, "name" | "image">;
  tags: Pick<Tag, "type" | "value" | "year">[];
};

export default function Player() {
  const { hash } = useLocation();
  const { player, frequency, stats } = useLoaderData<typeof loader>()!;

  const jumpTo = hash && /#\d+/.test(hash) ? Number(hash.slice(1)) : undefined;

  return (
    <Stack spacing={10}>
      <Stack spacing={4}>
        <Heading alignSelf="center">
          {player.name} (#{player.id})
        </Heading>
        <ButtonGroup justifyContent="center">
          <Button as={RemixLink} to="/">
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
      <PlayerStats stats={stats} />
      <PlayerTable ascensions={player.ascensions} jumpTo={jumpTo} />
    </Stack>
  );
}
