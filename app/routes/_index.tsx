import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Saṃsāra ♻️" },
    { name: "description", content: "Kingdom of Loathing ascension database" },
  ];
};

export default function Index() {
  return (
    <div>
      <h1>Saṃsāra ♻️</h1>
    </div>
  );
}
