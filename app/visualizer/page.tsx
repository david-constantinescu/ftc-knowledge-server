import { redirect } from "next/navigation";

export const metadata = {
  title: "Pedro Pathing Visualizer | FTC Knowledge",
  description:
    "Official Pedro Pathing Visualizer with AI bridge — full path authoring, export, simulation",
};

export default async function VisualizerPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; data?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.data) qs.set("data", params.data);
  if (params.session) qs.set("session", params.session);
  const query = qs.toString();
  redirect(`/official-visualizer/index.html${query ? `?${query}` : ""}`);
}
