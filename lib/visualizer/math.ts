export function lerp(ratio: number, start: number, end: number) {
  return start + (end - start) * ratio;
}

export function lerp2d(
  ratio: number,
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  return { x: lerp(ratio, start.x, end.x), y: lerp(ratio, start.y, end.y) };
}

export function getCurvePoint(
  t: number,
  points: { x: number; y: number }[]
): { x: number; y: number } {
  if (points.length === 1) return points[0];
  const newpoints: { x: number; y: number }[] = [];
  for (let i = 0, j = 1; j < points.length; i++, j++) {
    newpoints[i] = lerp2d(t, points[i], points[j]);
  }
  return getCurvePoint(t, newpoints);
}

export function getAngularDifference(start: number, end: number): number {
  const normalizedStart = (start + 360) % 360;
  const normalizedEnd = (end + 360) % 360;
  let diff = normalizedEnd - normalizedStart;
  if (diff > 180) diff -= 360;
  else if (diff < -180) diff += 360;
  return diff;
}

export function shortestRotation(
  startAngle: number,
  endAngle: number,
  percentage: number
) {
  const diff = getAngularDifference(startAngle, endAngle);
  return startAngle + diff * percentage;
}

export function fieldToCanvas(
  x: number,
  y: number,
  size: number,
  fieldSize: number
) {
  const scale = size / fieldSize;
  return { cx: x * scale, cy: size - y * scale };
}

export function canvasToField(
  cx: number,
  cy: number,
  size: number,
  fieldSize: number
) {
  const scale = fieldSize / size;
  return { x: cx * scale, y: (size - cy) * scale };
}

export function samplePathPoints(
  start: { x: number; y: number },
  controlPoints: { x: number; y: number }[],
  end: { x: number; y: number },
  samples = 40
) {
  const curve = [start, ...controlPoints, end];
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    pts.push(getCurvePoint(i / samples, curve));
  }
  return pts;
}

export function getRobotHeadingAtSegment(
  segmentIndex: number,
  t: number,
  startPoint: {
    heading: string;
    startDeg?: number;
    endDeg?: number;
    degrees?: number;
  },
  lines: {
    endPoint: {
      heading: string;
      startDeg?: number;
      endDeg?: number;
      degrees?: number;
    };
  }[]
): number {
  const line = lines[segmentIndex];
  if (!line) return startPoint.startDeg ?? 90;

  const ep = line.endPoint;
  if (ep.heading === "constant") return ep.degrees ?? 0;
  if (ep.heading === "linear") {
    const prev =
      segmentIndex === 0
        ? (startPoint.startDeg ?? 90)
        : (lines[segmentIndex - 1].endPoint.endDeg ??
            lines[segmentIndex - 1].endPoint.degrees ??
            90);
    return shortestRotation(prev, ep.endDeg ?? ep.startDeg ?? 90, t);
  }
  return ep.startDeg ?? 90;
}
