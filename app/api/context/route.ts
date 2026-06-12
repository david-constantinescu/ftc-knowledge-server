import { NextRequest, NextResponse } from "next/server";
import {
  searchResearch,
  getTemplate,
  getAllTemplates,
  getFullContext,
  getTeamExamples,
  searchCodebase,
} from "@/lib/knowledge";
import { getPattern, type PatternCategory } from "@/lib/patterns";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action") ?? "info";

  switch (action) {
    case "info":
      return NextResponse.json({
        name: "ftc-knowledge",
        version: "1.0.0",
        description:
          "FTC + Pedro Pathing research corpus for AI coding agents",
        mcp_endpoint: "/api/mcp",
        tools: [
          "ftc_search_research",
          "ftc_get_template",
          "ftc_get_full_context",
          "ftc_get_patterns",
          "ftc_get_team_examples",
          "ftc_search_codebase",
        ],
        rest_actions: [
          "info",
          "search",
          "template",
          "context",
          "patterns",
          "teams",
          "codebase",
        ],
      });

    case "search": {
      const query = searchParams.get("q");
      if (!query) {
        return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
      }
      const source = searchParams.get("source") ?? "all";
      const results = searchResearch(query, source as "all");
      return NextResponse.json({ query, source, results, count: results.length });
    }

    case "template": {
      const type = searchParams.get("type") ?? "all";
      const text = type === "all" ? getAllTemplates() : getTemplate(type);
      return NextResponse.json({ type, content: text });
    }

    case "context": {
      const include = searchParams.get("include")?.split(",") ?? undefined;
      const content = getFullContext(include);
      return NextResponse.json({ include: include ?? "default", content });
    }

    case "patterns": {
      const category = (searchParams.get("category") ?? "pathing") as PatternCategory;
      const content = getPattern(category);
      return NextResponse.json({ category, content });
    }

    case "teams": {
      const content = getTeamExamples();
      return NextResponse.json({ content });
    }

    case "codebase": {
      const pattern = searchParams.get("pattern");
      if (!pattern) {
        return NextResponse.json({ error: "Missing pattern parameter" }, { status: 400 });
      }
      const content = searchCodebase(pattern);
      return NextResponse.json({ pattern, content });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
