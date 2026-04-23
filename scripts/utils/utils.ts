export async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const slugify = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/g, "")
    .replace(/-+$/g, "");
