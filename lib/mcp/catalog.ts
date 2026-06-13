/**
 * Complete catalog of ftc-knowledge MCP tools for agents.
 */

export type ToolCategory =
  | "orchestrator"
  | "research"
  | "codegen"
  | "visualizer"
  | "robot"
  | "telemetry";

export interface McpToolEntry {
  name: string;
  category: ToolCategory;
  whenToUse: string;
  requiredBefore?: string[];
}

export const MCP_TOOL_CATALOG: McpToolEntry[] = [
  {
    name: "ftc_begin_ftc_session",
    category: "orchestrator",
    whenToUse:
      "REQUIRED FIRST CALL whenever the task involves FTC, Pedro Pathing, Control Hub, TeamCode, OpModes, or robot Java.",
  },
  {
    name: "ftc_autonomous_workflow",
    category: "orchestrator",
    whenToUse:
      "REQUIRED when user mentions autonomous, auto, auto routine, PathChain, or match auto period.",
    requiredBefore: ["ftc_begin_ftc_session"],
  },
  {
    name: "ftc_list_mcp_tools",
    category: "orchestrator",
    whenToUse: "Discover all available MCP tools and mandatory workflows.",
  },
  {
    name: "ftc_search_research",
    category: "research",
    whenToUse: "Look up Pedro/FTC docs, gotchas, hardware notes, tuning.",
  },
  {
    name: "ftc_get_full_context",
    category: "research",
    whenToUse: "Load full research bundle before generating non-trivial code.",
  },
  {
    name: "ftc_get_patterns",
    category: "research",
    whenToUse:
      "Get patterns: pathing, autos, localization, teleop, tuning, hardware, commands.",
  },
  {
    name: "ftc_get_template",
    category: "codegen",
    whenToUse: "Get FConstants, LConstants, auto OpMode, or subsystem templates.",
  },
  {
    name: "ftc_get_team_examples",
    category: "research",
    whenToUse: "Find verified team repos and high-signal Java examples.",
  },
  {
    name: "ftc_search_codebase",
    category: "research",
    whenToUse: "Search indexed Java files from verified FTC teams.",
  },
  {
    name: "ftc_robot_profile_template",
    category: "robot",
    whenToUse: "Get JSON template for robot-profile.json hardware names.",
  },
  {
    name: "ftc_robot_context",
    category: "robot",
    whenToUse: "REQUIRED before writing OpModes — pass robot profile for exact hardware names.",
  },
  {
    name: "ftc_visualizer_create_path",
    category: "visualizer",
    whenToUse: "Create path on official visualizer; returns shareUrl.",
  },
  {
    name: "ftc_visualizer_add_segment",
    category: "visualizer",
    whenToUse: "Append waypoint (prefer shareUrl + bridge for full editor).",
  },
  {
    name: "ftc_visualizer_get_session",
    category: "visualizer",
    whenToUse: "Get session summary, shareUrl, and .pp JSON.",
  },
  {
    name: "ftc_visualizer_export_code",
    category: "visualizer",
    whenToUse: "Export PathChain Java from session.",
  },
  {
    name: "ftc_visualizer_import_pp",
    category: "visualizer",
    whenToUse: "Import .pp trajectory.",
  },
  {
    name: "ftc_visualizer_list_fields",
    category: "visualizer",
    whenToUse: "List field maps.",
  },
  {
    name: "ftc_visualizer_bridge_help",
    category: "visualizer",
    whenToUse: "Docs for window.__PEDRO_VISUALIZER__ browser control.",
  },
  {
    name: "ftc_visualizer_execute",
    category: "visualizer",
    whenToUse: "Run official visualizer actions: exportJava, optimizeAll, play, …",
  },
  {
    name: "ftc_visualizer_list_sessions",
    category: "visualizer",
    whenToUse: "List ephemeral server sessions.",
  },
  {
    name: "ftc_submit_run_feedback",
    category: "telemetry",
    whenToUse: "After practice auto — pose error, tuning suggestions.",
  },
  {
    name: "ftc_list_run_feedback",
    category: "telemetry",
    whenToUse: "List recent run feedback.",
  },
];

export const FTC_TRIGGER_KEYWORDS = [
  "ftc",
  "first tech challenge",
  "pedro",
  "pedropathing",
  "pathing",
  "control hub",
  "opmode",
  "teamcode",
  "follower",
  "pathchain",
  "pinpoint",
  "otos",
  "autonomous",
  "teleop",
  "decode",
];

export const AUTONOMOUS_TRIGGER_KEYWORDS = [
  "autonomous",
  "auto routine",
  "auto opmode",
  "path auto",
  "pathchain",
  "starting pose",
  "auto period",
];

export function formatToolCatalog(): string {
  const byCategory = new Map<ToolCategory, McpToolEntry[]>();
  for (const t of MCP_TOOL_CATALOG) {
    const list = byCategory.get(t.category) ?? [];
    list.push(t);
    byCategory.set(t.category, list);
  }
  const lines = ["# ftc-knowledge MCP Tool Catalog", ""];
  for (const [cat, tools] of byCategory) {
    lines.push(`## ${cat}`, "");
    for (const t of tools) {
      lines.push(`### ${t.name}`, t.whenToUse);
      if (t.requiredBefore?.length) {
        lines.push(`Requires: ${t.requiredBefore.join(", ")}`);
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}

export const AGENT_INSTRUCTIONS = `# FTC Knowledge MCP — Agent Instructions

## When to use MCP (mandatory)

Use **ftc-knowledge** MCP whenever the task involves FTC, Pedro Pathing, Control Hub, TeamCode, OpModes, or robot Java.

**First tool call:** \`ftc_begin_ftc_session\`

## Autonomous (extra mandatory steps)

When user mentions autonomous, auto, or PathChain:

1. \`ftc_begin_ftc_session\` taskType=autonomous
2. \`ftc_autonomous_workflow\`
3. \`ftc_robot_context\`
4. \`ftc_visualizer_create_path\` → \`ftc_visualizer_execute\` exportJava
5. \`ftc_get_template\` auto + \`ftc_get_patterns\` autos

## MCP server

https://ftc-knowledge-server.vercel.app/api/mcp
`;
