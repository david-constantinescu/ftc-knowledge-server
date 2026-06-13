import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  searchResearch,
  getTemplate,
  getAllTemplates,
  getFullContext,
  getTeamExamples,
  searchCodebase,
} from "@/lib/knowledge";
import { getPattern, type PatternCategory } from "@/lib/patterns";
import { registerVisualizerTools } from "@/lib/visualizer/mcp";

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "ftc_search_research",
      {
        title: "Search FTC Research",
        description:
          "Search all FTC research docs, notes, links, and verified resources for Pedro Pathing and FTC programming",
        inputSchema: {
          query: z.string().describe("Search query"),
          source: z
            .enum([
              "technical_gold",
              "ai_guidance",
              "analysis",
              "verified_resources",
              "links",
              "skill",
              "complete_reference",
              "all",
            ])
            .optional()
            .describe("Limit search to a specific source"),
        },
      },
      async ({ query, source }) => {
        const results = searchResearch(query, source ?? "all");
        const text =
          results.length > 0
            ? results.join("\n\n---\n\n")
            : `No results for "${query}" in ${source ?? "all"} sources.`;
        return { content: [{ type: "text" as const, text }] };
      }
    );

    server.registerTool(
      "ftc_get_template",
      {
        title: "Get FTC Code Template",
        description:
          "Get FTC + Pedro Pathing code templates (fconstants, lconstants, auto, subsystem)",
        inputSchema: {
          type: z
            .enum(["fconstants", "lconstants", "auto", "subsystem", "all"])
            .describe("Template type to retrieve"),
        },
      },
      async ({ type }) => {
        const text = type === "all" ? getAllTemplates() : getTemplate(type);
        return {
          content: [
            {
              type: "text" as const,
              text: text || `Template "${type}" not found.`,
            },
          ],
        };
      }
    );

    server.registerTool(
      "ftc_get_full_context",
      {
        title: "Get Full FTC Context",
        description:
          "Get complete FTC + Pedro Pathing context bundle for accurate code generation",
        inputSchema: {
          include: z
            .array(z.string())
            .optional()
            .describe(
              "Sections to include: technical_gold, ai_guidance, analysis, verified_resources, skill, complete_reference"
            ),
        },
      },
      async ({ include }) => {
        const text = getFullContext(include);
        return { content: [{ type: "text" as const, text }] };
      }
    );

    server.registerTool(
      "ftc_get_patterns",
      {
        title: "Get FTC Patterns",
        description:
          "Get FTC + Pedro Pathing patterns by category (pathing, commands, localization, autos, teleop, tuning, hardware)",
        inputSchema: {
          category: z
            .enum([
              "pathing",
              "commands",
              "localization",
              "autos",
              "teleop",
              "tuning",
              "hardware",
            ])
            .describe("Pattern category"),
        },
      },
      async ({ category }) => {
        const text = getPattern(category as PatternCategory);
        return { content: [{ type: "text" as const, text }] };
      }
    );

    server.registerTool(
      "ftc_get_team_examples",
      {
        title: "Get Team Examples",
        description:
          "List verified FTC team repositories with Pedro Pathing examples and high-signal Java files",
        inputSchema: {},
      },
      async () => {
        const text = getTeamExamples();
        return { content: [{ type: "text" as const, text }] };
      }
    );

    server.registerTool(
      "ftc_search_codebase",
      {
        title: "Search Codebase Index",
        description:
          "Search the indexed high-signal Java files from verified FTC team repositories",
        inputSchema: {
          pattern: z.string().describe("Search pattern for Java file index"),
        },
      },
      async ({ pattern }) => {
        const text = searchCodebase(pattern);
        return { content: [{ type: "text" as const, text }] };
      }
    );

    registerVisualizerTools(server);
  },
  {},
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV === "development",
  }
);

export { handler as GET, handler as POST };
