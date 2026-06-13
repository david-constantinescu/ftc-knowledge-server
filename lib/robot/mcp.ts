import { z } from "zod";
import {
  EXAMPLE_ROBOT_PROFILE,
  formatRobotContext,
  robotProfileSchema,
} from "./profile";

export function registerRobotTools(server: {
  registerTool: (
    name: string,
    config: object,
    handler: (args: Record<string, unknown>) => Promise<{ content: { type: "text"; text: string }[] }>
  ) => void;
}) {
  server.registerTool(
    "ftc_robot_profile_template",
    {
      title: "Get Robot Profile Template",
      description:
        "Returns a JSON template for your team's robot profile. Copy into your repo as robot-profile.json and fill in hardware names from Robot Configuration.",
      inputSchema: {},
    },
    async () => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(EXAMPLE_ROBOT_PROFILE, null, 2),
        },
      ],
    })
  );

  server.registerTool(
    "ftc_robot_context",
    {
      title: "Format Robot Context for Code Generation",
      description:
        "Pass your robot profile JSON (motor names, localizer, drivetrain, tuning). Returns formatted context the AI should use when writing FTC/Pedro code. Always call this before generating OpModes.",
      inputSchema: {
        profile: z
          .record(z.string(), z.unknown())
          .describe("Robot profile object — use ftc_robot_profile_template as starting point"),
      },
    },
    async (input) => {
      const parsed = robotProfileSchema.parse(input.profile);
      const text = formatRobotContext(parsed);
      return { content: [{ type: "text" as const, text }] };
    }
  );
}
