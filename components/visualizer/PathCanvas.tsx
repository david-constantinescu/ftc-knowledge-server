"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TrajectoryData } from "@/lib/visualizer/types";
import {
  fieldToCanvas,
  getCurvePoint,
  getRobotHeadingAtSegment,
  samplePathPoints,
} from "@/lib/visualizer/math";
import { FIELD_SIZE } from "@/lib/visualizer/defaults";

interface PathCanvasProps {
  data: TrajectoryData;
  playing: boolean;
  progress: number;
  onProgressChange?: (p: number) => void;
  onCanvasClick?: (x: number, y: number) => void;
}

export function PathCanvas({
  data,
  playing,
  progress,
  onProgressChange,
  onCanvasClick,
}: PathCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldImgRef = useRef<HTMLImageElement | null>(null);
  const animRef = useRef<number | null>(null);
  const [size] = useState(640);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    if (fieldImgRef.current?.complete) {
      ctx.drawImage(fieldImgRef.current, 0, 0, size, size);
    } else {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      for (let i = 0; i <= 6; i++) {
        const p = (size / 6) * i;
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, p);
        ctx.lineTo(size, p);
        ctx.stroke();
      }
    }

    for (const shape of data.shapes) {
      if (shape.vertices.length < 3) continue;
      ctx.beginPath();
      const first = fieldToCanvas(shape.vertices[0].x, shape.vertices[0].y, size, FIELD_SIZE);
      ctx.moveTo(first.cx, first.cy);
      for (let i = 1; i < shape.vertices.length; i++) {
        const p = fieldToCanvas(shape.vertices[i].x, shape.vertices[i].y, size, FIELD_SIZE);
        ctx.lineTo(p.cx, p.cy);
      }
      ctx.closePath();
      ctx.fillStyle = shape.fillColor;
      ctx.fill();
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const { startPoint, lines } = data;

    lines.forEach((line, idx) => {
      const prev =
        idx === 0
          ? startPoint
          : lines[idx - 1].endPoint;
      const pts = samplePathPoints(prev, line.controlPoints, line.endPoint, 50);
      ctx.beginPath();
      const start = fieldToCanvas(pts[0].x, pts[0].y, size, FIELD_SIZE);
      ctx.moveTo(start.cx, start.cy);
      for (let i = 1; i < pts.length; i++) {
        const p = fieldToCanvas(pts[i].x, pts[i].y, size, FIELD_SIZE);
        ctx.lineTo(p.cx, p.cy);
      }
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 3;
      ctx.stroke();

      for (const cp of line.controlPoints) {
        const p = fieldToCanvas(cp.x, cp.y, size, FIELD_SIZE);
        ctx.fillStyle = line.color;
        ctx.beginPath();
        ctx.arc(p.cx, p.cy, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      const end = fieldToCanvas(line.endPoint.x, line.endPoint.y, size, FIELD_SIZE);
      ctx.fillStyle = line.color;
      ctx.beginPath();
      ctx.arc(end.cx, end.cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    const sp = fieldToCanvas(startPoint.x, startPoint.y, size, FIELD_SIZE);
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(sp.cx, sp.cy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    const totalSegments = lines.length;
    if (totalSegments > 0 && progress > 0) {
      const segFloat = (progress / 100) * totalSegments;
      const segIdx = Math.min(Math.floor(segFloat), totalSegments - 1);
      const t = segFloat - segIdx;
      const line = lines[segIdx];
      const prev =
        segIdx === 0 ? startPoint : lines[segIdx - 1].endPoint;
      const curve = [prev, ...line.controlPoints, line.endPoint];
      const pos = getCurvePoint(t, curve);
      const heading = getRobotHeadingAtSegment(segIdx, t, startPoint, lines);
      const rp = fieldToCanvas(pos.x, pos.y, size, FIELD_SIZE);

      ctx.save();
      ctx.translate(rp.cx, rp.cy);
      ctx.rotate((-heading * Math.PI) / 180);
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      const rw = (16 / FIELD_SIZE) * size;
      const rh = (16 / FIELD_SIZE) * size;
      ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
      ctx.strokeRect(-rw / 2, -rh / 2, rw, rh);
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.moveTo(rw / 2, 0);
      ctx.lineTo(rw / 2 - 8, -5);
      ctx.lineTo(rw / 2 - 8, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }, [data, progress, size]);

  useEffect(() => {
    const img = new Image();
    img.src = `/fields/${data.fieldMap}`;
    img.onload = () => {
      fieldImgRef.current = img;
      draw();
    };
    img.onerror = () => {
      img.src = "/fields/decode.webp";
      img.onload = () => {
        fieldImgRef.current = img;
        draw();
      };
    };
  }, [data.fieldMap, draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (!playing) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    let start: number | null = null;
    const duration = 8000;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const p = Math.min(100, (elapsed / duration) * 100);
      onProgressChange?.(p);
      if (p < 100) {
        animRef.current = requestAnimationFrame(tick);
      }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [playing, onProgressChange]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCanvasClick) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * size;
    const cy = ((e.clientY - rect.top) / rect.height) * size;
    const scale = FIELD_SIZE / size;
    const x = cx * scale;
    const y = (size - cy) * scale;
    onCanvasClick(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  };

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      onClick={handleClick}
      style={{
        width: "100%",
        maxWidth: size,
        height: "auto",
        borderRadius: 12,
        border: "1px solid #333",
        cursor: onCanvasClick ? "crosshair" : "default",
        display: "block",
      }}
    />
  );
}
