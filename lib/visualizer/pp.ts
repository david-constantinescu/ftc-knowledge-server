import { createEmptyTrajectory, getDefaultStartPoint } from "./defaults";
import type { TrajectoryData } from "./types";

export function trajectoryToPp(data: TrajectoryData): string {
  return JSON.stringify(
    {
      startPoint: data.startPoint,
      lines: data.lines,
      shapes: data.shapes,
      pathChains: data.pathChains,
    },
    null,
    2
  );
}

export function parsePp(json: string): TrajectoryData {
  const parsed = JSON.parse(json) as Partial<TrajectoryData>;
  const base = createEmptyTrajectory(
    (parsed as { fieldMap?: string }).fieldMap as
      | "decode.webp"
      | "intothedeep.webp"
      | undefined
  );
  return {
    ...base,
    ...parsed,
    startPoint: parsed.startPoint ?? getDefaultStartPoint(),
    lines: parsed.lines ?? base.lines,
    shapes: parsed.shapes ?? base.shapes,
    pathChains: parsed.pathChains ?? base.pathChains,
    fieldMap: parsed.fieldMap ?? base.fieldMap,
  };
}
