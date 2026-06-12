import { readFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_ROOT = join(process.cwd(), "data");

function readData(relativePath: string): string {
  const fullPath = join(DATA_ROOT, relativePath);
  if (!existsSync(fullPath)) return "";
  return readFileSync(fullPath, "utf-8");
}

export type ResearchSource =
  | "technical_gold"
  | "ai_guidance"
  | "analysis"
  | "verified_resources"
  | "links"
  | "skill"
  | "complete_reference";

export interface ResearchContent {
  technicalGold: string;
  aiGuidance: string;
  analysis: string;
  verifiedResources: string;
  linksDocs: string;
  linksReddit: string;
  repoSummary: string;
  javaFiles: string;
  skill: string;
  completeReference: string;
  fconstants: string;
  lconstants: string;
  autoTemplate: string;
  subsystemTemplate: string;
}

let cachedContent: ResearchContent | null = null;

export function loadResearch(): ResearchContent {
  if (cachedContent) return cachedContent;

  cachedContent = {
    technicalGold: readData("notes/technical_gold.md"),
    aiGuidance: readData("notes/ai-agent-code-guidance.md"),
    analysis: readData("notes/analysis.md"),
    verifiedResources: readData("discovery/verified_resources.md"),
    linksDocs: readData("links/official-docs.md"),
    linksReddit: readData("links/blogs-reddit-opinions.md"),
    repoSummary: readData("repo_indexes/repo-scan-summary.txt"),
    javaFiles: readData("repo_indexes/high-signal-java-files.txt"),
    skill: readData("SKILL.md"),
    completeReference: readData("complete-ftc-reference.md"),
    fconstants: readData("templates/FConstants.java.template"),
    lconstants: readData("templates/LConstants.java.template"),
    autoTemplate: readData("templates/AutoTemplate.java.template"),
    subsystemTemplate: readData("templates/SubsystemTemplate.java.template"),
  };

  return cachedContent;
}

export function getSources(): Record<ResearchSource, string> {
  const c = loadResearch();
  return {
    technical_gold: c.technicalGold,
    ai_guidance: c.aiGuidance,
    analysis: c.analysis,
    verified_resources: c.verifiedResources,
    links: `${c.linksDocs}\n\n${c.linksReddit}`,
    skill: c.skill,
    complete_reference: c.completeReference,
  };
}

export function searchResearch(
  query: string,
  source: ResearchSource | "all" = "all"
): string[] {
  const q = query.toLowerCase();
  const sources = getSources();
  const keys =
    source === "all"
      ? (Object.keys(sources) as ResearchSource[])
      : [source];

  const results: string[] = [];
  for (const key of keys) {
    const text = sources[key];
    if (text?.toLowerCase().includes(q)) {
      results.push(`## ${key}\n${text}`);
    }
  }
  return results;
}

export function getTemplate(type: string): string {
  const c = loadResearch();
  const map: Record<string, string> = {
    fconstants: c.fconstants,
    lconstants: c.lconstants,
    auto: c.autoTemplate,
    subsystem: c.subsystemTemplate,
  };
  return map[type] ?? "";
}

export function getAllTemplates(): string {
  const c = loadResearch();
  let output = "## Templates\n\n";
  const entries: [string, string][] = [
    ["FConstants", c.fconstants],
    ["LConstants", c.lconstants],
    ["AutoTemplate", c.autoTemplate],
    ["SubsystemTemplate", c.subsystemTemplate],
  ];
  for (const [name, content] of entries) {
    if (content) {
      output += `### ${name}\n\`\`\`java\n${content}\n\`\`\`\n\n`;
    }
  }
  return output;
}

export function getFullContext(include?: string[]): string {
  const c = loadResearch();
  const sections = include ?? [
    "technical_gold",
    "ai_guidance",
    "analysis",
    "skill",
  ];

  let context = "# FTC + Pedro Pathing Context\n\n";
  if (sections.includes("technical_gold")) {
    context += `## Technical Gold\n${c.technicalGold}\n\n`;
  }
  if (sections.includes("ai_guidance")) {
    context += `## AI Guidance\n${c.aiGuidance}\n\n`;
  }
  if (sections.includes("analysis")) {
    context += `## Analysis\n${c.analysis}\n\n`;
  }
  if (sections.includes("verified_resources")) {
    context += `## Verified Resources\n${c.verifiedResources}\n\n`;
  }
  if (sections.includes("skill")) {
    context += `## Skill Reference\n${c.skill}\n\n`;
  }
  if (sections.includes("complete_reference")) {
    context += `## Complete Reference\n${c.completeReference}\n\n`;
  }
  return context;
}

export function getTeamExamples(): string {
  const c = loadResearch();
  return (
    `# Verified Team Repositories\n\n${c.repoSummary}\n\n` +
    `## High-Signal Java Files\n\n${c.javaFiles}`
  );
}

export function searchCodebase(pattern: string): string {
  const c = loadResearch();
  const p = pattern.toLowerCase();
  const lines = c.javaFiles
    .split("\n")
    .filter((line) => line.toLowerCase().includes(p));
  if (lines.length === 0) return `No matches for "${pattern}" in java file index.`;
  return lines.slice(0, 50).join("\n");
}
