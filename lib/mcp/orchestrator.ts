import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getTemplate } from "@/lib/knowledge";
import { getPattern } from "@/lib/patterns";
import {
  AGENT_INSTRUCTIONS,
  AUTONOMOUS_TRIGGER_KEYWORDS,
  FTC_TRIGGER_KEYWORDS,
  MCP_TOOL_CATALOG,
  formatToolCatalog,
} from "./catalog";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function registerOrchestratorTools(server: McpServer) {
  server.registerTool(
    "ftc_begin_ftc_session",
    {
      title: "Begin FTC Coding Session (REQUIRED FIRST)",
      description:
        "MANDATORY entry point for any FTC / Pedro Pathing / Control Hub / TeamCode task. Returns agent workflow, trigger keywords, and next MCP tools to call. Call this before writing any robot code.",
      inputSchema: {
        taskType: z
          .enum(["coding", "autonomous", "teleop", "pathing", "localization", "debug", "research"])
          .optional()
          .describe("What the user is trying to do"),
        alliance: z.enum(["red", "blue"]).optional(),
        season: z.string().optional().describe("e.g. DECODE 2025-2026"),
        summary: z.string().optional().describe("Brief user goal for tailored next steps"),
      },
    },
    async (input) => {
      const { taskType, alliance, season, summary } = input as {
        taskType?: string;
        alliance?: string;
        season?: string;
        summary?: string;
      };
      const isAutonomous =
        taskType === "autonomous" ||
        taskType === "pathing" ||
        /auto/i.test(summary ?? "");

      const nextSteps = isAutonomous
        ? [
            "1. ftc_autonomous_workflow — full auto routine checklist",
            "2. ftc_robot_profile_template → ftc_robot_context (hardware names)",
            "3. ftc_get_patterns category 'autos' + ftc_get_template type 'auto'",
            "4. ftc_visualizer_create_path → shareUrl → ftc_visualizer_execute exportJava",
            "5. ftc_get_full_context for Pedro gotchas (PID zeroing, no PathConstraints)",
          ]
        : [
            "1. ftc_robot_profile_template → ftc_robot_context if writing OpModes",
            "2. ftc_get_full_context or ftc_search_research for the topic",
            "3. ftc_get_template / ftc_get_patterns as needed",
            "4. ftc_visualizer_* if designing paths",
          ];

      const text = [
        "# FTC MCP Session Started",
        "",
        `Task: ${taskType ?? "coding"} | Alliance: ${alliance ?? "unspecified"} | Season: ${season ?? "current"}`,
        summary ? `Goal: ${summary}` : "",
        "",
        "## Rules",
        "- Pedro coords: Forward=+X, Left=+Y, field 0–144 inches",
        "- Zero PID defaults in FollowerConstants before tuning",
        "- Non-blocking follower.update() loop — no Thread.sleep during paths",
        "- Avoid PathConstraints on Control Hub (crash/battery bug)",
        "",
        "## Next MCP tools (call in order)",
        ...nextSteps,
        "",
        isAutonomous
          ? "## Autonomous detected\nCall **ftc_autonomous_workflow** immediately after this."
          : "",
        "",
        "## All tools",
        "Call ftc_list_mcp_tools for full catalog.",
        "",
        `Visualizer: ${getBaseUrl()}/visualizer`,
        `MCP endpoint: ${getBaseUrl()}/api/mcp`,
      ]
        .filter(Boolean)
        .join("\n");

      return { content: [{ type: "text" as const, text }] };
    }
  );

  server.registerTool(
    "ftc_autonomous_workflow",
    {
      title: "Autonomous Routine Workflow (REQUIRED for auto)",
      description:
        "MANDATORY when user mentions autonomous, auto routine, PathChain, or match auto. Returns step-by-step MCP workflow plus auto patterns and template pointers. Use before writing any @Autonomous OpMode.",
      inputSchema: {
        alliance: z.enum(["red", "blue"]).optional(),
        startingPose: z
          .object({ x: z.number(), y: z.number(), headingDeg: z.number().optional() })
          .optional(),
        routineDescription: z
          .string()
          .optional()
          .describe("What the auto should do — e.g. score preload, park"),
        field: z.enum(["decode.webp", "intothedeep.webp"]).optional(),
      },
    },
    async (input) => {
      const { alliance, startingPose, routineDescription, field } = input as {
        alliance?: string;
        startingPose?: { x: number; y: number; headingDeg?: number };
        routineDescription?: string;
        field?: string;
      };

      const autoPatterns = getPattern("autos");
      const pathingPatterns = getPattern("pathing");
      const autoTemplatePreview = getTemplate("auto").slice(0, 2500);

      const visualizerPayload = startingPose
        ? {
            hint: "Call ftc_visualizer_create_path with this startPoint and your segments",
            startPoint: {
              x: startingPose.x,
              y: startingPose.y,
              heading: "linear" as const,
              startDeg: startingPose.headingDeg ?? 90,
              endDeg: (startingPose.headingDeg ?? 90) + 90,
            },
            field: field ?? "decode.webp",
            alliance,
          }
        : {
            hint: "Call ftc_visualizer_create_path to design path on official visualizer",
            field: field ?? "decode.webp",
          };

      const text = [
        "# Autonomous Workflow — follow in order",
        "",
        routineDescription ? `**Routine goal:** ${routineDescription}` : "",
        alliance ? `**Alliance:** ${alliance} (mirror paths if red)` : "",
        "",
        "## Step 1 — Robot context",
        "`ftc_robot_profile_template` → fill profile → `ftc_robot_context`",
        "",
        "## Step 2 — Patterns & templates",
        "`ftc_get_patterns` category `autos`",
        "`ftc_get_patterns` category `pathing`",
        "`ftc_get_template` type `auto`",
        "`ftc_get_template` type `fconstants` + `lconstants`",
        "",
        "## Step 3 — Path on official visualizer",
        "`ftc_visualizer_create_path` with waypoints → open **shareUrl**",
        "`ftc_visualizer_execute` action `exportJava` mode `class` (or full via bridge)",
        "Optional: browser MCP → shareUrl → `window.__PEDRO_VISUALIZER__.execute('optimizeAll')`",
        "",
        JSON.stringify(visualizerPayload, null, 2),
        "",
        "## Step 4 — OpMode structure",
        "- @Autonomous OpMode with pathState switch (non-blocking)",
        "- follower.update() every loop iteration",
        "- follower.followPath(pathChain, true) with hold at end",
        "- Telemetry: pathState, pose x/y, heading",
        "",
        "## Step 5 — After field test",
        "`ftc_submit_run_feedback` with planned vs actual pose",
        "",
        "---",
        "## Auto patterns (from corpus)",
        autoPatterns.slice(0, 4000),
        "",
        "---",
        "## Pathing patterns (excerpt)",
        pathingPatterns.slice(0, 2000),
        "",
        "---",
        "## Auto template (preview — use ftc_get_template for full)",
        "```java",
        autoTemplatePreview,
        "...",
        "```",
      ].join("\n");

      return { content: [{ type: "text" as const, text }] };
    }
  );

  server.registerTool(
    "ftc_list_mcp_tools",
    {
      title: "List All MCP Tools",
      description:
        "Complete catalog of ftc-knowledge MCP tools, categories, and when each must be used.",
      inputSchema: {},
    },
    async () => ({
      content: [
        {
          type: "text" as const,
          text: [
            formatToolCatalog(),
            "",
            "## Trigger keywords (use MCP when user says these)",
            FTC_TRIGGER_KEYWORDS.join(", "),
            "",
            "## Autonomous triggers (also call ftc_autonomous_workflow)",
            AUTONOMOUS_TRIGGER_KEYWORDS.join(", "),
          ].join("\n"),
        },
      ],
    })
  );
}

export function registerOrchestratorPromptsAndResources(server: McpServer) {
  server.registerPrompt(
      "ftc-coding-session",
      {
        description:
          "Start an FTC/Pedro Pathing coding session. Use when task involves FTC robot programming.",
        argsSchema: {
          goal: z.string().optional().describe("User goal"),
        },
      },
      async (args) => ({
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: [
                "You are working on FIRST Tech Challenge robot code.",
                "You MUST use the ftc-knowledge MCP server.",
                "Your FIRST action: call MCP tool `ftc_begin_ftc_session`.",
                "Do NOT write OpMode or Pedro code until MCP context is loaded.",
                args.goal ? `User goal: ${args.goal}` : "",
                "Then call ftc_robot_context, ftc_get_full_context, and relevant templates.",
              ]
                .filter(Boolean)
                .join("\n"),
            },
          },
        ],
      })
    );

  server.registerPrompt(
    "ftc-autonomous-routine",
      {
        description:
          "Build an FTC autonomous routine with Pedro Pathing. Use when autonomous/auto is mentioned.",
        argsSchema: {
          alliance: z.string().optional(),
          description: z.string().optional(),
        },
      },
      async (args) => ({
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: [
                "Build an FTC autonomous routine using Pedro Pathing.",
                "MANDATORY MCP sequence:",
                "1. ftc_begin_ftc_session taskType=autonomous",
                "2. ftc_autonomous_workflow",
                "3. ftc_robot_context",
                "4. ftc_visualizer_create_path → exportJava via ftc_visualizer_execute",
                "5. ftc_get_template auto + ftc_get_patterns autos",
                args.alliance ? `Alliance: ${args.alliance}` : "",
                args.description ? `Routine: ${args.description}` : "",
              ]
                .filter(Boolean)
                .join("\n"),
            },
          },
        ],
      })
  );

  server.registerResource(
    "ftc-agent-instructions",
      "ftc://agent-instructions",
      {
        description:
          "Mandatory instructions for AI agents using ftc-knowledge MCP",
        mimeType: "text/markdown",
      },
      async () => ({
        contents: [
          {
            uri: "ftc://agent-instructions",
            mimeType: "text/markdown",
            text: AGENT_INSTRUCTIONS,
          },
        ],
      })
  );

  server.registerResource(
    "ftc-mcp-tool-catalog",
      "ftc://tool-catalog",
      {
        description: "Complete ftc-knowledge MCP tool catalog",
        mimeType: "text/markdown",
      },
      async () => ({
        contents: [
          {
            uri: "ftc://tool-catalog",
            mimeType: "text/markdown",
            text: formatToolCatalog(),
          },
        ],
      })
  );
}

/** Server instructions embedded in MCP metadata */
export function getMcpServerInstructions(): string {
  return [
    "FTC + Pedro Pathing knowledge server for AI coding agents.",
    "REQUIRED: Call ftc_begin_ftc_session before any FTC code generation.",
    "REQUIRED for autonomous: ftc_autonomous_workflow then visualizer + auto template tools.",
    `Tools: ${MCP_TOOL_CATALOG.map((t) => t.name).join(", ")}`,
  ].join(" ");
}
