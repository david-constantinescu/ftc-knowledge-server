"use client";

import { useCallback, useEffect, useState } from "react";
import { PathCanvas } from "@/components/visualizer/PathCanvas";
import type { TrajectoryData } from "@/lib/visualizer/types";
import { FIELD_OPTIONS } from "@/lib/visualizer/defaults";
import { trajectoryToPp } from "@/lib/visualizer/pathBuilder";

interface SessionResponse {
  id: string;
  name: string;
  field: string;
  pathCount: number;
  previewUrl: string;
  ppJson?: string;
}

export default function VisualizerClient({
  initialSessionId,
}: {
  initialSessionId?: string;
}) {
  const [sessionId, setSessionId] = useState(initialSessionId ?? "");
  const [data, setData] = useState<TrajectoryData | null>(null);
  const [name, setName] = useState("Path Session");
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [javaCode, setJavaCode] = useState("");
  const [status, setStatus] = useState("Loading...");
  const [clickMode, setClickMode] = useState(false);

  const loadSession = useCallback(async (id: string) => {
    const res = await fetch(`/api/visualizer?action=data&sessionId=${id}`);
    if (!res.ok) {
      setStatus("Session not found — create a new one.");
      return;
    }
    const trajectory = (await res.json()) as TrajectoryData;
    setData(trajectory);
    setSessionId(id);
    setStatus(`Loaded session ${id}`);
    window.history.replaceState({}, "", `/visualizer?session=${id}`);
  }, []);

  const createSession = useCallback(async () => {
    const res = await fetch("/api/visualizer?action=create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, field: "decode.webp" }),
    });
    const summary = (await res.json()) as SessionResponse;
    setSessionId(summary.id);
    await loadSession(summary.id);
    setStatus(`Created session ${summary.id}`);
  }, [loadSession, name]);

  useEffect(() => {
    if (initialSessionId) {
      loadSession(initialSessionId);
    } else {
      createSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSessionId]);

  const addSegmentAt = async (x: number, y: number) => {
    if (!sessionId) return;
    const res = await fetch("/api/visualizer?action=add_segment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        segment: { x, y, heading: "linear", startDeg: 90, endDeg: 180 },
      }),
    });
    if (res.ok) {
      await loadSession(sessionId);
      setStatus(`Added point (${x}, ${y})`);
    }
  };

  const exportCode = async () => {
    if (!sessionId) return;
    const res = await fetch(
      `/api/visualizer?action=export&sessionId=${sessionId}&mode=class`
    );
    const json = await res.json();
    setJavaCode(json.code ?? "");
  };

  const downloadPp = () => {
    if (!data) return;
    const blob = new Blob([trajectoryToPp(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "-").toLowerCase()}.pp`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!data) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#666" }}>
        {status}
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <h2 style={styles.h2}>Path Planner</h2>
        <p style={styles.muted}>{status}</p>
        <label style={styles.label}>
          Session name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
          />
        </label>
        <label style={styles.label}>
          Field
          <select
            value={data.fieldMap}
            onChange={async (e) => {
              const updated = { ...data, fieldMap: e.target.value };
              setData(updated);
              if (sessionId) {
                await fetch("/api/visualizer?action=create", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name,
                    field: e.target.value,
                    startPoint: data.startPoint,
                    segments: data.lines.map((l) => ({
                      x: l.endPoint.x,
                      y: l.endPoint.y,
                      heading: l.endPoint.heading,
                      startDeg:
                        l.endPoint.heading === "linear"
                          ? l.endPoint.startDeg
                          : undefined,
                      endDeg:
                        l.endPoint.heading === "linear"
                          ? l.endPoint.endDeg
                          : undefined,
                      degrees:
                        l.endPoint.heading === "constant"
                          ? l.endPoint.degrees
                          : undefined,
                      controlPoints: l.controlPoints,
                      name: l.name,
                      color: l.color,
                    })),
                  }),
                }).then(async (r) => {
                  const s = await r.json();
                  setSessionId(s.id);
                  loadSession(s.id);
                });
              }
            }}
            style={styles.input}
          >
            {FIELD_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        <div style={styles.section}>
          <strong>Start</strong>
          <div style={styles.coords}>
            ({data.startPoint.x}, {data.startPoint.y}) —{" "}
            {data.startPoint.heading}
          </div>
        </div>

        <div style={styles.section}>
          <strong>Paths ({data.lines.length})</strong>
          {data.lines.map((line, i) => (
            <div key={line.id} style={styles.pathRow}>
              <span
                style={{
                  ...styles.dot,
                  background: line.color,
                }}
              />
              {line.name ?? `Path ${i + 1}`}: ({line.endPoint.x},{" "}
              {line.endPoint.y})
            </div>
          ))}
        </div>

        <div style={styles.btnRow}>
          <button
            style={styles.btn}
            onClick={() => {
              setPlaying((p) => !p);
              if (playing) setProgress(0);
            }}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            style={styles.btnSecondary}
            onClick={() => {
              setProgress(0);
              setPlaying(false);
            }}
          >
            Reset
          </button>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => {
            setPlaying(false);
            setProgress(Number(e.target.value));
          }}
          style={{ width: "100%" }}
        />

        <button
          style={{
            ...styles.btn,
            ...(clickMode ? styles.btnActive : {}),
          }}
          onClick={() => setClickMode((c) => !c)}
        >
          {clickMode ? "Click mode ON" : "Add point by click"}
        </button>

        <button style={styles.btn} onClick={exportCode}>
          Export Java
        </button>
        <button style={styles.btnSecondary} onClick={downloadPp}>
          Download .pp
        </button>
        <a
          href="https://visualizer.pedropathing.com"
          target="_blank"
          rel="noreferrer"
          style={styles.link}
        >
          Open Official Visualizer →
        </a>

        {javaCode && (
          <pre style={styles.code}>{javaCode}</pre>
        )}
      </aside>

      <main style={styles.main}>
        <PathCanvas
          data={data}
          playing={playing}
          progress={progress}
          onProgressChange={setProgress}
          onCanvasClick={clickMode ? addSegmentAt : undefined}
        />
        <p style={styles.hint}>
          Green dot = start pose. Colored lines = path segments. White rectangle
          = robot during playback. Forward = +X, Left = +Y (Pedro coordinates).
        </p>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: 24,
    padding: "24px 32px 48px",
    maxWidth: 1200,
    margin: "0 auto",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  main: {
    minWidth: 0,
  },
  h2: { margin: 0, fontSize: 22 },
  muted: { margin: 0, fontSize: 13, color: "#666" },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 14,
  },
  section: { fontSize: 13 },
  coords: { color: "#444", marginTop: 4 },
  pathRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    fontSize: 13,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
  },
  btnRow: { display: "flex", gap: 8 },
  btn: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 13,
  },
  btnSecondary: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "#fff",
    cursor: "pointer",
    fontSize: 13,
  },
  btnActive: {
    background: "#16a34a",
  },
  link: {
    fontSize: 13,
    color: "#2563eb",
    textDecoration: "none",
  },
  code: {
    fontSize: 11,
    background: "#111",
    color: "#eee",
    padding: 12,
    borderRadius: 8,
    overflow: "auto",
    maxHeight: 280,
    whiteSpace: "pre-wrap",
  },
  hint: {
    marginTop: 12,
    fontSize: 13,
    color: "#666",
  },
};
