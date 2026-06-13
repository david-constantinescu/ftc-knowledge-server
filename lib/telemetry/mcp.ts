import { z } from "zod";
import {
  analyzeRunFeedback,
  listRunFeedback,
  submitRunFeedback,
} from "./ingest";

export function registerTelemetryTools(server: {
  registerTool: (
    name: string,
    config: object,
    handler: (args: Record<string, unknown>) => Promise<{ content: { type: "text"; text: string }[] }>
  ) => void;
}) {
  server.registerTool(
    "ftc_submit_run_feedback",
    {
      title: "Submit Autonomous Run Feedback",
      description:
        "Send field/run feedback after a practice or match: planned vs actual pose, pathState, telemetry snapshot, or a description of what went wrong. Returns tuning suggestions for Pedro pathing and localization.",
      inputSchema: {
        runId: z.string().optional(),
        opMode: z.string().optional(),
        alliance: z.enum(["red", "blue"]).optional(),
        plannedPose: z
          .object({
            x: z.number(),
            y: z.number(),
            headingDeg: z.number().optional(),
          })
          .optional(),
        actualPose: z
          .object({
            x: z.number(),
            y: z.number(),
            headingDeg: z.number().optional(),
          })
          .optional(),
        pathState: z.string().optional(),
        followerBusy: z.boolean().optional(),
        telemetry: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
        issue: z.string().describe("What happened on the field — e.g. missed sample, overshot turn").optional(),
      },
    },
    async (input) => {
      const entry = submitRunFeedback(input);
      const analysis = analyzeRunFeedback(entry);
      const text = [
        `# Run feedback: ${analysis.summary}`,
        "",
        "## Suggestions",
        ...analysis.suggestions.map((s) => `- ${s}`),
        "",
        "## Tuning hints",
        ...analysis.tuningHints.map((h) => `- ${h}`),
        "",
        "_Tip: stream pose from FTC Dashboard (Pinpoint/OTOS x,y,heading) into this tool after each auto run._",
      ].join("\n");
      return { content: [{ type: "text" as const, text }] };
    }
  );

  server.registerTool(
    "ftc_list_run_feedback",
    {
      title: "List Recent Run Feedback",
      description: "List recent autonomous run feedback submitted to this server instance",
      inputSchema: {
        limit: z.number().optional().describe("Max entries (default 10)"),
      },
    },
    async (input) => {
      const { limit } = input as { limit?: number };
      const entries = listRunFeedback(limit ?? 10);
      return {
        content: [
          {
            type: "text" as const,
            text: entries.length
              ? JSON.stringify(entries, null, 2)
              : "No run feedback yet. Use ftc_submit_run_feedback after practice runs.",
          },
        ],
      };
    }
  );
}
