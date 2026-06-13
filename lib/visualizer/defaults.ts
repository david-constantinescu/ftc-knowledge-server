import type { FieldMapId, Line, Point, Shape, TrajectoryData } from "./types";

export const FIELD_SIZE = 141.5;

export const FIELD_OPTIONS: { id: FieldMapId; label: string }[] = [
  { id: "decode.webp", label: "DECODE (2025-2026)" },
  { id: "intothedeep.webp", label: "Into The Deep (2024-2025)" },
  { id: "centerstage.webp", label: "Centerstage (2023-2024)" },
];

export function getDefaultStartPoint(): Point {
  return {
    x: 56,
    y: 8,
    heading: "linear",
    startDeg: 90,
    endDeg: 180,
  };
}

export function getDefaultShapes(): Shape[] {
  return [
    {
      id: "triangle-1",
      name: "Red Goal",
      vertices: [
        { x: 141.5, y: 70 },
        { x: 141.5, y: 141.5 },
        { x: 120, y: 141.5 },
        { x: 138, y: 119 },
        { x: 138, y: 70 },
      ],
      color: "#dc2626",
      fillColor: "rgba(255, 107, 107, 0.35)",
    },
    {
      id: "triangle-2",
      name: "Blue Goal",
      vertices: [
        { x: 6, y: 119 },
        { x: 25, y: 141.5 },
        { x: 0, y: 141.5 },
        { x: 0, y: 70 },
        { x: 6, y: 70 },
      ],
      color: "#2563eb",
      fillColor: "rgba(96, 165, 250, 0.35)",
    },
  ];
}

export function getDefaultLines(): Line[] {
  return [
    {
      id: randomId("line"),
      name: "Path 1",
      endPoint: { x: 56, y: 36, heading: "linear", startDeg: 90, endDeg: 180 },
      controlPoints: [],
      color: "#8cb58c",
    },
  ];
}

export function createEmptyTrajectory(field: FieldMapId = "decode.webp"): TrajectoryData {
  const lines = getDefaultLines();
  return {
    startPoint: getDefaultStartPoint(),
    lines,
    shapes: getDefaultShapes(),
    pathChains: [
      {
        id: randomId("chain"),
        name: "Main Chain",
        color: "#8cb58c",
        lineIds: lines.map((l) => l.id),
      },
    ],
    fieldMap: field,
  };
}

export function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const PATH_COLORS = [
  "#8cb58c",
  "#ffc516",
  "#60a5fa",
  "#f472b6",
  "#a78bfa",
  "#fb923c",
];
