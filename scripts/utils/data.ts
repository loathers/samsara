import { AscensionClass, Path, createClient } from "data-of-loathing";

const client = createClient();
const loaded = client.load();

export async function fetchPaths() {
  try {
    await loaded;
    return await client.query.find(Path, {}, { orderBy: { id: "ASC" } });
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function fetchClasses() {
  try {
    await loaded;
    return await client.query.find(AscensionClass, {}, { orderBy: { id: "ASC" }, populate: ["path"] });
  } catch (error) {
    console.error(error);
    return null;
  }
}
