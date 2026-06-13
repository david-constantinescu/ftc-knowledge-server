import type { Line, PathChain, Point } from "./types";

function sanitizeIdentifier(input: string | undefined, fallback: string): string {
  const cleaned = (input || "").replace(/[^a-zA-Z0-9]/g, "");
  if (!cleaned) return fallback;
  if (/^[0-9]/.test(cleaned)) return `${fallback}${cleaned}`;
  return cleaned;
}

function buildPathSegmentCode(line: Line, startExpression: string): string {
  const headingTypeToFunctionName = {
    constant: "setConstantHeadingInterpolation",
    linear: "setLinearHeadingInterpolation",
    tangential: "setTangentHeadingInterpolation",
  } as const;

  const controlPoints = line.controlPoints
    .map((point) => `new Pose(${point.x.toFixed(3)}, ${point.y.toFixed(3)})`)
    .join(",\n            ");

  const curveType =
    line.controlPoints.length === 0 ? "BezierLine" : "BezierCurve";

  const allPoints = controlPoints
    ? `${startExpression},\n            ${controlPoints},\n            new Pose(${line.endPoint.x.toFixed(3)}, ${line.endPoint.y.toFixed(3)})`
    : `${startExpression},\n            new Pose(${line.endPoint.x.toFixed(3)}, ${line.endPoint.y.toFixed(3)})`;

  const headingConfig =
    line.endPoint.heading === "constant"
      ? `Math.toRadians(${line.endPoint.degrees ?? 0})`
      : line.endPoint.heading === "linear"
        ? `Math.toRadians(${line.endPoint.startDeg ?? 0}), Math.toRadians(${line.endPoint.endDeg ?? 0})`
        : "";

  const reverseConfig = line.endPoint.reverse ? "\n          .setReversed()" : "";

  return `.addPath(
            new ${curveType}(
              ${allPoints}
            )
          )
          .${headingTypeToFunctionName[line.endPoint.heading]}(${headingConfig})${reverseConfig}`;
}

export function generateJavaCode(
  startPoint: Point,
  lines: Line[],
  pathChains: PathChain[] = [],
  exportMode: "class" | "coordinates" = "class"
): string {
  const linesWithIds = lines.map((line, idx) => ({
    ...line,
    id: line.id || `line-${idx + 1}`,
  }));
  const lineById = new Map(linesWithIds.map((line) => [line.id, line]));

  const inputChains =
    pathChains.length > 0
      ? pathChains
      : linesWithIds.map((line, idx) => ({
          id: line.id,
          name: line.name || `Path ${idx + 1}`,
          color: line.color,
          lineIds: [line.id],
        }));

  const normalizedChains = inputChains
    .map((chain, idx) => ({
      ...chain,
      id: chain.id || `chain-${idx + 1}`,
      name: chain.name || `PathChain${idx + 1}`,
      lineIds: (chain.lineIds || []).filter((id) => lineById.has(id)),
    }))
    .filter((chain) => chain.lineIds.length > 0);

  const fieldDeclarations = normalizedChains
    .map((chain, idx) => {
      const variableName = sanitizeIdentifier(chain.name, `pathChain${idx + 1}`);
      return `public PathChain ${variableName};`;
    })
    .join("\n    ");

  const pathAssignments = normalizedChains
    .map((chain, chainIdx) => {
      const variableName = sanitizeIdentifier(chain.name, `pathChain${chainIdx + 1}`);
      const segmentSnippets = chain.lineIds
        .map((lineId) => {
          const line = lineById.get(lineId);
          if (!line) return null;
          const lineIndex = linesWithIds.findIndex((ln) => ln.id === line.id);
          const startExpression =
            lineIndex <= 0
              ? `new Pose(${startPoint.x.toFixed(3)}, ${startPoint.y.toFixed(3)})`
              : `new Pose(${linesWithIds[lineIndex - 1].endPoint.x.toFixed(3)}, ${linesWithIds[lineIndex - 1].endPoint.y.toFixed(3)})`;
          return buildPathSegmentCode(line, startExpression);
        })
        .filter((s): s is string => Boolean(s));

      return `${variableName} = follower.pathBuilder()
          ${segmentSnippets.join("\n          ")}
          .build();`;
    })
    .join("\n\n      ");

  if (exportMode === "coordinates") return pathAssignments;

  return `public static class Paths {
    ${fieldDeclarations}

    public Paths(Follower follower) {
      ${pathAssignments}
    }
  }`;
}

export function generateStartingPoseCode(startPoint: Point): string {
  const heading =
    startPoint.heading === "constant"
      ? startPoint.degrees ?? 90
      : startPoint.startDeg ?? 90;
  return `follower.setStartingPose(new Pose(${startPoint.x.toFixed(3)}, ${startPoint.y.toFixed(3)}, Math.toRadians(${heading})));`;
}
