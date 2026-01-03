import { createClient } from "data-of-loathing";

const client = createClient();

export async function fetchPaths() {
  try {
    const data = await client.query({
      allPaths: {
        nodes: {
          id: true,
          image: true,
          name: true,
        },
      },
    });

    return data.allPaths?.nodes.filter((n) => n !== null) ?? [];
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function fetchClasses() {
  try {
    const data = await client.query({
      allClasses: {
        nodes: {
          id: true,
          image: true,
          name: true,
          path: true,
        },
      },
    });

    return data.allClasses?.nodes.filter((n) => n !== null) ?? [];
  } catch (error) {
    console.error(error);
    return null;
  }
}
