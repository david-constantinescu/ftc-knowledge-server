import { z } from "zod";
import {
  generateJavaCode,
  generateStartingPoseCode,
} from "./codeExporter";
import {
  addSegment,
  sessionSummary,
  trajectoryToPp,
} from "./pathBuilder";
import { FIELD_OPTIONS } from "./defaults";
import {
  createSession,
  getSession,
  importSessionFromPp,
  listSessions,
  replaceSessionData,
} from "./sessions";
import type { AddSegmentInput, CreateSessionInput } from "./types";
import {
  VISUALIZER_BRIDGE_ACTIONS,
  bridgeHelp,
  buildBridgeInvocation,
} from "./bridgeActions";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

const segmentSchema = z.object({
  x: z.number(),
  y: z.number(),
  heading: z.enum(["linear", "constant", "tangential"]).optional(),
  startDeg: z.number().optional(),
  endDeg: z.number().optional(),
  degrees: z.number().optional(),
  reverse: z.boolean().optional(),
  controlPoints: z
    .array(z.object({ x: z.number(), y: z.number() }))
    .optional(),
  name: z.string().optional(),
  color: z.string().optional(),
});

export function registerVisualizerTools(server: {
  registerTool: (
    name: string,
    config: object,
    handler: (args: Record<string, unknown>) => Promise<{ content: { type: "text"; text: string }[] }>
  ) => void;
}) {
  server.registerTool(
    "ftc_visualizer_create_path",
    {
      title: "Create Pedro Path Visualizer Session",
      description:
        "Create a path on the official Pedro Pathing Visualizer (full UI at shareUrl). Returns shareUrl with embedded ?data= state. Coordinate system: Forward=+X, Left=+Y, field 0-144 inches.",
      inputSchema: {
        name: z.string().optional().describe("Session name"),
        field: z
          .enum(["decode.webp", "intothedeep.webp"])
          .optional()
          .describe("Field map (default decode.webp)"),
        startPoint: z
          .object({
            x: z.number(),
            y: z.number(),
            heading: z.enum(["linear", "constant", "tangential"]).optional(),
            startDeg: z.number().optional(),
            endDeg: z.number().optional(),
            degrees: z.number().optional(),
            reverse: z.boolean().optional(),
          })
          .optional(),
        segments: z
          .array(segmentSchema)
          .optional()
          .describe("Path segments / waypoints to draw on the field"),
      },
    },
    async (input) => {
      const args = input as CreateSessionInput & { name?: string };
      const session = createSession(args, args.name);
      const summary = sessionSummary(session, getBaseUrl());
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "ftc_visualizer_add_segment",
    {
      title: "Add Path Segment",
      description:
        "Add a path segment to an existing visualizer session. Each segment goes from the previous endpoint to the new x,y.",
      inputSchema: {
        sessionId: z.string().describe("Visualizer session ID"),
        segment: segmentSchema,
      },
    },
    async (input) => {
      const { sessionId, segment } = input as {
        sessionId: string;
        segment: AddSegmentInput;
      };
      const session = getSession(sessionId);
      if (!session) {
        return {
          content: [{ type: "text" as const, text: `Session ${sessionId} not found.` }],
        };
      }
      const updated = replaceSessionData(
        sessionId,
        addSegment(session.data, segment)
      )!;
      const summary = sessionSummary(updated, getBaseUrl());
      return {
        content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
      };
    }
  );

  server.registerTool(
    "ftc_visualizer_get_session",
    {
      title: "Get Visualizer Session",
      description:
        "Get full path session data, preview URL, and .pp JSON for a visualizer session",
      inputSchema: {
        sessionId: z.string().describe("Visualizer session ID"),
      },
    },
    async (input) => {
      const { sessionId } = input as { sessionId: string };
      const session = getSession(sessionId);
      if (!session) {
        return {
          content: [{ type: "text" as const, text: `Session ${sessionId} not found.` }],
        };
      }
      const summary = sessionSummary(session, getBaseUrl());
      return {
        content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
      };
    }
  );

  server.registerTool(
    "ftc_visualizer_export_code",
    {
      title: "Export Pedro Path Java Code",
      description:
        "Export Pedro Pathing Java PathChain code from a visualizer session",
      inputSchema: {
        sessionId: z.string().describe("Visualizer session ID"),
        mode: z
          .enum(["class", "coordinates", "starting_pose"])
          .optional()
          .describe("Export mode"),
      },
    },
    async (input) => {
      const { sessionId, mode } = input as {
        sessionId: string;
        mode?: "class" | "coordinates" | "starting_pose";
      };
      const session = getSession(sessionId);
      if (!session) {
        return {
          content: [{ type: "text" as const, text: `Session ${sessionId} not found.` }],
        };
      }
      const { startPoint, lines, pathChains } = session.data;
      let code = "";
      if (mode === "starting_pose") {
        code = generateStartingPoseCode(startPoint);
      } else {
        code = generateJavaCode(
          startPoint,
          lines,
          pathChains,
          mode === "coordinates" ? "coordinates" : "class"
        );
      }
      return {
        content: [
          {
            type: "text" as const,
            text: `# Exported from session ${sessionId}\n\n\`\`\`java\n${code}\n\`\`\``,
          },
        ],
      };
    }
  );

  server.registerTool(
    "ftc_visualizer_import_pp",
    {
      title: "Import .pp Path File",
      description:
        "Import a Pedro Pathing .pp JSON trajectory file into a new visualizer session",
      inputSchema: {
        ppJson: z.string().describe("Raw .pp file JSON content"),
        name: z.string().optional(),
      },
    },
    async (input) => {
      const { ppJson, name } = input as { ppJson: string; name?: string };
      const session = importSessionFromPp(ppJson, name);
      const summary = sessionSummary(session, getBaseUrl());
      return {
        content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
      };
    }
  );

  server.registerTool(
    "ftc_visualizer_list_fields",
    {
      title: "List Visualizer Fields",
      description: "List available FTC field maps for the path visualizer",
      inputSchema: {},
    },
    async () => {
      const text = FIELD_OPTIONS.map(
        (f) => `- ${f.id}: ${f.label}`
      ).join("\n");
      return {
        content: [
          {
            type: "text" as const,
            text: `# Available Field Maps\n\n${text}\n\nOfficial visualizer: https://visualizer.pedropathing.com\nIntegrated preview: ${getBaseUrl()}/visualizer`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "ftc_visualizer_bridge_help",
    {
      title: "Official Visualizer AI Bridge Documentation",
      description:
        "How AI agents control the official Pedro Pathing Visualizer via window.__PEDRO_VISUALIZER__ and browser MCP. Lists all programmatic actions.",
      inputSchema: {},
    },
    async () => ({
      content: [{ type: "text" as const, text: bridgeHelp(getBaseUrl()) }],
    })
  );

  server.registerTool(
    "ftc_visualizer_execute",
    {
      title: "Execute Visualizer Bridge Action",
      description:
        "Returns JavaScript to run on the official visualizer page for full UI parity (play, export, optimize, undo, file ops, etc.). Use with browser_navigate to shareUrl then CDP evaluate. Actions: getState, addPath, exportJava, optimizeAll, click, ...",
      inputSchema: {
        action: z
          .enum(VISUALIZER_BRIDGE_ACTIONS as unknown as [string, ...string[]])
          .describe("Bridge action to execute"),
        params: z
          .record(z.string(), z.unknown())
          .optional()
          .describe("Action parameters (e.g. { mode: 'class' } for exportJava)"),
        shareUrl: z
          .string()
          .optional()
          .describe("Optional visualizer URL with ?data= — from create_path shareUrl"),
      },
    },
    async (input) => {
      const { action, params, shareUrl } = input as {
        action: string;
        params?: Record<string, unknown>;
        shareUrl?: string;
      };
      const invocation = buildBridgeInvocation(
        getBaseUrl(),
        action,
        params,
        shareUrl
      );
      return {
        content: [{ type: "text" as const, text: JSON.stringify(invocation, null, 2) }],
      };
    }
  );

  server.registerTool(
    "ftc_visualizer_list_sessions",
    {
      title: "List Visualizer Sessions",
      description: "List active path planning sessions in this server instance",
      inputSchema: {},
    },
    async () => {
      const sessions = listSessions().map((s) => sessionSummary(s, getBaseUrl()));
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(sessions, null, 2),
          },
        ],
      };
    }
  );
}

export function handleVisualizerApi(
  method: string,
  searchParams: URLSearchParams,
  body?: Record<string, unknown>
) {
  const baseUrl = getBaseUrl();
  const action = searchParams.get("action") ?? "info";

  if (action === "info") {
    return {
      visualizerUrl: `${baseUrl}/official-visualizer/index.html`,
      redirectFrom: `${baseUrl}/visualizer`,
      officialUpstream: "https://github.com/Pedro-Pathing/Visualizer",
      bridge: "window.__PEDRO_VISUALIZER__.execute(action, params)",
      bridgeActions: VISUALIZER_BRIDGE_ACTIONS,
      fields: FIELD_OPTIONS,
      actions: [
        "info",
        "create",
        "get",
        "add_segment",
        "export",
        "import",
        "list",
        "data",
      ],
    };
  }

  if (action === "create" && method === "POST") {
    const session = createSession(body as CreateSessionInput);
    return sessionSummary(session, baseUrl);
  }

  if (action === "get") {
    const id = searchParams.get("sessionId") ?? searchParams.get("id");
    if (!id) return { error: "Missing sessionId" };
    const session = getSession(id);
    if (!session) {
      return {
        error: "Session not found",
        hint: "Serverless sessions expire. Use shareUrl (?data=...) from MCP tools or re-create the path.",
      };
    }
    return sessionSummary(session, baseUrl);
  }

  if (action === "add_segment" && method === "POST") {
    const sessionId = (body?.sessionId as string) ?? searchParams.get("sessionId");
    if (!sessionId) return { error: "Missing sessionId" };
    const session = getSession(sessionId);
    if (!session) {
      return {
        error: "Session not found",
        hint: "Serverless sessions expire. Use shareUrl (?data=...) from MCP tools or re-create the path.",
      };
    }
    const updated = replaceSessionData(
      sessionId,
      addSegment(session.data, body?.segment as Parameters<typeof addSegment>[1])
    )!;
    return sessionSummary(updated, baseUrl);
  }

  if (action === "export") {
    const id = searchParams.get("sessionId");
    if (!id) return { error: "Missing sessionId" };
    const session = getSession(id);
    if (!session) {
      return {
        error: "Session not found",
        hint: "Serverless sessions expire. Use shareUrl (?data=...) from MCP tools or re-create the path.",
      };
    }
    const mode = searchParams.get("mode") ?? "class";
    if (mode === "pp") return { pp: trajectoryToPp(session.data) };
    if (mode === "starting_pose") {
      return { code: generateStartingPoseCode(session.data.startPoint) };
    }
    return {
      code: generateJavaCode(
        session.data.startPoint,
        session.data.lines,
        session.data.pathChains,
        mode === "coordinates" ? "coordinates" : "class"
      ),
    };
  }

  if (action === "import" && method === "POST") {
    const ppJson = body?.ppJson as string;
    if (!ppJson) return { error: "Missing ppJson" };
    const session = importSessionFromPp(ppJson, body?.name as string | undefined);
    return sessionSummary(session, baseUrl);
  }

  if (action === "list") {
    return listSessions().map((s) => sessionSummary(s, baseUrl));
  }

  if (action === "data") {
    const id = searchParams.get("sessionId");
    if (!id) return { error: "Missing sessionId" };
    const session = getSession(id);
    if (!session) {
      return {
        error: "Session not found",
        hint: "Serverless sessions expire. Use shareUrl (?data=...) from MCP tools or re-create the path.",
      };
    }
    return session.data;
  }

  return { error: "Unknown action" };
}
