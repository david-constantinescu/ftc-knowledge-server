import VisualizerClient from "./visualizer-client";

export const metadata = {
  title: "Pedro Path Visualizer | FTC Knowledge",
  description:
    "Interactive Pedro Pathing path planner — design autonomous paths, preview on field, export Java code",
};

export default async function VisualizerPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const params = await searchParams;
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <header
        style={{
          padding: "16px 32px",
          borderBottom: "1px solid #e2e8f0",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <a href="/" style={{ color: "#64748b", fontSize: 13, textDecoration: "none" }}>
            ← FTC Knowledge
          </a>
          <h1 style={{ margin: "4px 0 0", fontSize: 20 }}>
            Pedro Pathing Visualizer
          </h1>
        </div>
        <span style={{ fontSize: 12, color: "#64748b" }}>
          Compatible with .pp format · MCP tools available
        </span>
      </header>
      <VisualizerClient initialSessionId={params.session} />
    </div>
  );
}
