export interface BasePoint {
  x: number;
  y: number;
  locked?: boolean;
}

export type Point = BasePoint &
  (
    | {
        heading: "linear";
        startDeg: number;
        endDeg: number;
        degrees?: never;
        reverse?: never;
      }
    | {
        heading: "constant";
        degrees: number;
        startDeg?: never;
        endDeg?: never;
        reverse?: never;
      }
    | {
        heading: "tangential";
        degrees?: never;
        startDeg?: never;
        endDeg?: never;
        reverse: boolean;
      }
  );

export type ControlPoint = BasePoint;

export interface Line {
  id: string;
  endPoint: Point;
  controlPoints: ControlPoint[];
  color: string;
  name?: string;
  locked?: boolean;
}

export interface PathChain {
  id: string;
  name: string;
  color: string;
  lineIds: string[];
}

export interface Shape {
  id: string;
  name?: string;
  vertices: BasePoint[];
  color: string;
  fillColor: string;
}

export interface TrajectoryData {
  startPoint: Point;
  lines: Line[];
  shapes: Shape[];
  pathChains: PathChain[];
  fieldMap: string;
}

export interface VisualizerSession {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: TrajectoryData;
}

export type FieldMapId = "decode.webp" | "intothedeep.webp" | "centerstage.webp";

export interface SegmentInput {
  x: number;
  y: number;
  heading?: "linear" | "constant" | "tangential";
  startDeg?: number;
  endDeg?: number;
  degrees?: number;
  reverse?: boolean;
  controlPoints?: { x: number; y: number }[];
  name?: string;
  color?: string;
}

export interface CreateSessionInput {
  name?: string;
  field?: FieldMapId;
  startPoint?: {
    x?: number;
    y?: number;
    heading?: "linear" | "constant" | "tangential";
    startDeg?: number;
    endDeg?: number;
    degrees?: number;
    reverse?: boolean;
  };
  segments?: SegmentInput[];
}

export interface AddSegmentInput extends SegmentInput {}
