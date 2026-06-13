import {
  decodeTrajectoryPayload,
  encodeTrajectoryPayload,
} from "./codec";
import {
  createEmptyTrajectory,
  getDefaultStartPoint,
  PATH_COLORS,
  randomId,
} from "./defaults";
import { trajectoryToPp } from "./pp";
import type {
  AddSegmentInput,
  CreateSessionInput,
  Point,
  SegmentInput,
  TrajectoryData,
  VisualizerSession,
} from "./types";

function buildPoint(input: SegmentInput, fallbackHeading: Point): Point {
  const heading = input.heading ?? fallbackHeading.heading;

  if (heading === "constant") {
    return {
      x: input.x,
      y: input.y,
      heading: "constant",
      degrees: input.degrees ?? 90,
    };
  }
  if (heading === "tangential") {
    return {
      x: input.x,
      y: input.y,
      heading: "tangential",
      reverse: input.reverse ?? false,
    };
  }
  return {
    x: input.x,
    y: input.y,
    heading: "linear",
    startDeg: input.startDeg ?? 90,
    endDeg: input.endDeg ?? 180,
  };
}

export function buildTrajectoryFromInput(
  input: CreateSessionInput
): TrajectoryData {
  const field = input.field ?? "decode.webp";
  const base = createEmptyTrajectory(field);

  if (input.startPoint) {
    const sp = input.startPoint;
    base.startPoint = buildPoint(
      {
        x: sp.x ?? base.startPoint.x,
        y: sp.y ?? base.startPoint.y,
        heading: sp.heading,
        startDeg: sp.startDeg,
        endDeg: sp.endDeg,
        degrees: sp.degrees,
        reverse: sp.reverse,
      },
      base.startPoint
    );
  }

  if (input.segments && input.segments.length > 0) {
    base.lines = input.segments.map((seg, idx) => ({
      id: randomId("line"),
      name: seg.name ?? `Path ${idx + 1}`,
      endPoint: buildPoint(seg, base.startPoint),
      controlPoints: (seg.controlPoints ?? []).map((cp) => ({ ...cp })),
      color: seg.color ?? PATH_COLORS[idx % PATH_COLORS.length],
    }));
    base.pathChains = [
      {
        id: randomId("chain"),
        name: "Main Chain",
        color: base.lines[0]?.color ?? "#8cb58c",
        lineIds: base.lines.map((l) => l.id),
      },
    ];
  }

  return base;
}

export function addSegment(
  data: TrajectoryData,
  segment: AddSegmentInput
): TrajectoryData {
  const idx = data.lines.length;
  const lastHeading =
    idx === 0
      ? data.startPoint
      : data.lines[idx - 1].endPoint;

  const line = {
    id: randomId("line"),
    name: segment.name ?? `Path ${idx + 1}`,
    endPoint: buildPoint(segment, lastHeading as Point),
    controlPoints: (segment.controlPoints ?? []).map((cp) => ({ ...cp })),
    color: segment.color ?? PATH_COLORS[idx % PATH_COLORS.length],
  };

  const lines = [...data.lines, line];
  const chain = data.pathChains[0] ?? {
    id: randomId("chain"),
    name: "Main Chain",
    color: line.color,
    lineIds: [],
  };

  return {
    ...data,
    lines,
    pathChains: [
      {
        ...chain,
        lineIds: lines.map((l) => l.id),
      },
    ],
  };
}

export function resetTrajectory(field?: string): TrajectoryData {
  const f = field === "intothedeep.webp" ? field : "decode.webp";
  return createEmptyTrajectory(f);
}

export { parsePp, trajectoryToPp } from "./pp";
export { encodeTrajectoryPayload, decodeTrajectoryPayload };

export function sessionSummary(session: VisualizerSession, baseUrl: string) {
  const encoded = encodeTrajectoryPayload(session.data);
  const shareUrl = `${baseUrl}/official-visualizer/index.html?data=${encoded}`;
  return {
    id: session.id,
    name: session.name,
    field: session.data.fieldMap,
    pathCount: session.data.lines.length,
    startPoint: session.data.startPoint,
    endPoints: session.data.lines.map((l) => ({
      name: l.name,
      x: l.endPoint.x,
      y: l.endPoint.y,
      heading: l.endPoint.heading,
    })),
    /** Prefer shareUrl — survives serverless cold starts; session ID is instance-local only */
    previewUrl: shareUrl,
    shareUrl,
    editUrl: shareUrl,
    sessionUrl: `${baseUrl}/official-visualizer/index.html?session=${session.id}`,
    officialVisualizerNote:
      "Download the .pp file from the preview page and load it at https://visualizer.pedropathing.com",
    ppJson: trajectoryToPp(session.data),
  };
}
