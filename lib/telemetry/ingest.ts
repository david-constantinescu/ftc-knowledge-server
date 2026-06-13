import { z } from "zod";

const poseSchema = z.object({
  x: z.number(),
  y: z.number(),
  headingDeg: z.number().optional(),
});

const runFeedbackSchema = z.object({
  runId: z.string().optional(),
  opMode: z.string().optional(),
  alliance: z.enum(["red", "blue"]).optional(),
  /** Planned vs actual — inches, Pedro frame */
  plannedPose: poseSchema.optional(),
  actualPose: poseSchema.optional(),
  pathState: z.string().optional(),
  followerBusy: z.boolean().optional(),
  /** Free-form telemetry key/values from FTC Dashboard or Driver Station log */
  telemetry: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  /** What went wrong or what to tune */
  issue: z.string().optional(),
  timestamp: z.string().optional(),
});

export type RunFeedback = z.infer<typeof runFeedbackSchema>;

export interface RunAnalysis {
  summary: string;
  suggestions: string[];
  tuningHints: string[];
}

const globalStore = globalThis as typeof globalThis & {
  __ftcRunFeedback?: RunFeedback[];
};

function getStore(): RunFeedback[] {
  if (!globalStore.__ftcRunFeedback) {
    globalStore.__ftcRunFeedback = [];
  }
  return globalStore.__ftcRunFeedback;
}

export function parseRunFeedback(input: unknown): RunFeedback {
  return runFeedbackSchema.parse(input);
}

export function submitRunFeedback(input: unknown): RunFeedback {
  const feedback = parseRunFeedback(input);
  const entry: RunFeedback = {
    ...feedback,
    runId: feedback.runId ?? `run-${Date.now()}`,
    timestamp: feedback.timestamp ?? new Date().toISOString(),
  };
  const store = getStore();
  store.unshift(entry);
  if (store.length > 50) store.length = 50;
  return entry;
}

export function listRunFeedback(limit = 10): RunFeedback[] {
  return getStore().slice(0, limit);
}

export function analyzeRunFeedback(feedback: RunFeedback): RunAnalysis {
  const suggestions: string[] = [];
  const tuningHints: string[] = [];

  if (feedback.plannedPose && feedback.actualPose) {
    const dx = feedback.actualPose.x - feedback.plannedPose.x;
    const dy = feedback.actualPose.y - feedback.plannedPose.y;
    const err = Math.hypot(dx, dy);
    if (err > 3) {
      suggestions.push(
        `Pose error ${err.toFixed(1)}" (Δx=${dx.toFixed(1)}, Δy=${dy.toFixed(1)}). Check localizer calibration, wheel odometry constants, and Pinpoint/OTOS mount.`
      );
      tuningHints.push("Increase translational P slightly if consistently short; decrease if overshooting.");
    } else if (err > 1) {
      suggestions.push(
        `Minor pose drift ${err.toFixed(1)}". Verify starting pose matches visualizer and alliance mirror.`
      );
    }
  }

  if (feedback.pathState?.toLowerCase().includes("turn")) {
    tuningHints.push("Heading oscillation: reduce heading P or check IMU/localizer heading lag.");
  }

  if (feedback.issue) {
    const lower = feedback.issue.toLowerCase();
    if (lower.includes("oscillat") || lower.includes("wobble")) {
      tuningHints.push("Zero default PID in FollowerConstants; reduce P gains 20–30%.");
    }
    if (lower.includes("pinpoint") || lower.includes("hang")) {
      suggestions.push("Pinpoint: known stop() hang — ensure normalizeAngle workaround in your localizer wrapper.");
    }
    if (lower.includes("battery") || lower.includes("crash")) {
      suggestions.push("Avoid PathConstraints in current Pedro versions on Control Hub.");
    }
  }

  if (feedback.followerBusy === true && feedback.pathState) {
    suggestions.push(
      `Follower still busy at pathState "${feedback.pathState}". Ensure update loop calls follower.update() every iteration without blocking sleeps.`
    );
  }

  const telem = feedback.telemetry ?? {};
  for (const [key, val] of Object.entries(telem)) {
    if (
      typeof val === "number" &&
      (key.toLowerCase().includes("error") || key.toLowerCase().includes("pose"))
    ) {
      if (Math.abs(val) > 2) {
        suggestions.push(`Telemetry ${key}=${val}: investigate localization or path end tolerance.`);
      }
    }
  }

  if (suggestions.length === 0 && tuningHints.length === 0) {
    suggestions.push(
      "No automatic issues detected. Paste planned vs actual poses or describe the failure for targeted tuning."
    );
  }

  const summary = [
    feedback.opMode ? `OpMode: ${feedback.opMode}` : null,
    feedback.alliance ? `Alliance: ${feedback.alliance}` : null,
    feedback.pathState ? `Path state: ${feedback.pathState}` : null,
    feedback.issue ? `Reported: ${feedback.issue}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    summary: summary || "Run feedback received",
    suggestions,
    tuningHints,
  };
}
