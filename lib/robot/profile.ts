import { z } from "zod";

export const robotProfileSchema = z.object({
  teamNumber: z.number().optional(),
  season: z.string().optional(),
  alliance: z.enum(["red", "blue"]).optional(),
  drivetrain: z
    .enum(["mecanum", "tank", "swerve", "other"])
    .optional(),
  localizer: z
    .enum(["pinpoint", "otos", "goBildaPinpoint", "twoWheel", "none"])
    .optional(),
  controlHubNames: z
    .object({
      leftFront: z.string().optional(),
      leftBack: z.string().optional(),
      rightFront: z.string().optional(),
      rightBack: z.string().optional(),
    })
    .optional(),
  servos: z.record(z.string(), z.string()).optional(),
  sensors: z.record(z.string(), z.string()).optional(),
  massLbs: z.number().optional(),
  trackWidthIn: z.number().optional(),
  wheelDiameterIn: z.number().optional(),
  followerTuning: z
    .object({
      translationalP: z.number().optional(),
      headingP: z.number().optional(),
      driveP: z.number().optional(),
    })
    .optional(),
  notes: z.string().optional(),
});

export type RobotProfile = z.infer<typeof robotProfileSchema>;

export const EXAMPLE_ROBOT_PROFILE: RobotProfile = {
  teamNumber: 12345,
  season: "DECODE 2025-2026",
  alliance: "blue",
  drivetrain: "mecanum",
  localizer: "pinpoint",
  controlHubNames: {
    leftFront: "leftFront",
    leftBack: "leftBack",
    rightFront: "rightFront",
    rightBack: "rightBack",
  },
  servos: {
    intake: "intake",
    claw: "claw",
  },
  sensors: {
    pinpoint: "pinpoint",
    colorSensor: "color",
  },
  massLbs: 42,
  trackWidthIn: 13.5,
  wheelDiameterIn: 4,
  followerTuning: {
    translationalP: 0.1,
    headingP: 0.5,
    driveP: 0.015,
  },
  notes:
    "Pinpoint mounted forward-facing; OTOS not used. Mirror auto for red alliance.",
};

export function formatRobotContext(profile: RobotProfile): string {
  const lines: string[] = [
    "# Robot Profile (use exact hardware names in generated code)",
    "",
  ];

  if (profile.teamNumber) lines.push(`Team: ${profile.teamNumber}`);
  if (profile.season) lines.push(`Season: ${profile.season}`);
  if (profile.alliance) lines.push(`Default alliance: ${profile.alliance}`);
  if (profile.drivetrain) lines.push(`Drivetrain: ${profile.drivetrain}`);
  if (profile.localizer) lines.push(`Localizer: ${profile.localizer}`);

  if (profile.controlHubNames) {
    lines.push("", "## Drive motors (Robot Configuration names)");
    for (const [role, name] of Object.entries(profile.controlHubNames)) {
      if (name) lines.push(`- ${role}: "${name}"`);
    }
  }

  if (profile.servos && Object.keys(profile.servos).length) {
    lines.push("", "## Servos");
    for (const [role, name] of Object.entries(profile.servos)) {
      lines.push(`- ${role}: "${name}"`);
    }
  }

  if (profile.sensors && Object.keys(profile.sensors).length) {
    lines.push("", "## Sensors");
    for (const [role, name] of Object.entries(profile.sensors)) {
      lines.push(`- ${role}: "${name}"`);
    }
  }

  const dims: string[] = [];
  if (profile.trackWidthIn != null) dims.push(`track width ${profile.trackWidthIn}"`);
  if (profile.wheelDiameterIn != null)
    dims.push(`wheel diameter ${profile.wheelDiameterIn}"`);
  if (profile.massLbs != null) dims.push(`mass ~${profile.massLbs} lb`);
  if (dims.length) lines.push("", `## Physical: ${dims.join(", ")}`);

  if (profile.followerTuning) {
    lines.push("", "## Pedro follower tuning hints");
    const t = profile.followerTuning;
    if (t.translationalP != null)
      lines.push(`- translational P: ${t.translationalP}`);
    if (t.headingP != null) lines.push(`- heading P: ${t.headingP}`);
    if (t.driveP != null) lines.push(`- drive P: ${t.driveP}`);
  }

  if (profile.notes) {
    lines.push("", "## Team notes", profile.notes);
  }

  lines.push(
    "",
    "## Code generation rules",
    "- Use ONLY the hardware names listed above in hardwareMap.get() calls",
    "- Pedro coords: Forward=+X, Left=+Y, field 0–144 inches",
    "- Zero PID defaults in FollowerConstants before tuning",
    "- Non-blocking update loop; no Thread.sleep during path following",
    "- Mirror paths explicitly for opposite alliance"
  );

  return lines.join("\n");
}
