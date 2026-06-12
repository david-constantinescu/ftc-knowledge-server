# Guidance For An AI Agent Writing FTC + Pedro Pathing Code

## What the agent should infer from the corpus

Most successful FTC codebases separate robot code into:

- constants/config
- subsystems
- commands or actions
- OpModes
- autonomous route definitions
- tuning/test OpModes

The better repos avoid stuffing everything into one OpMode. The FTC 12527 code is especially useful because it shows Pedro Pathing integrated with command-based mechanisms, shooter alignment, vision, and autonomous drive commands.

## Pedro Pathing implementation rules

1. Add dependencies and repositories first.
2. Create a single constants/factory location for `Follower`.
3. Keep Pedro path creation separate from mechanism commands.
4. Call the follower update loop continuously.
5. Do not block the loop with long sleeps while following a path.
6. Treat localization as a dependency that must be proven before route tuning.
7. Keep field coordinate assumptions explicit in code comments/constants.
8. Use dashboard/panels drawing and telemetry every loop while tuning.

## Repo patterns to copy

- `AutoDriveCommand`: wrapper command around `Follower.followPath(...)` and completion checks.
- `AutoBrakeCommand`: holding or braking at a pose after a path.
- `Constants.createFollower(hardwareMap)`: factory pattern for Pedro setup.
- `Tuning.java`: separate test OpMode for localization, heading, velocity, and PIDF tuning.
- `PedroAutoSample`: small, readable autonomous path chain sample.
- `DashTuner`: dashboard-based hardware verification before writing full robot logic.

## Repo patterns to avoid copying blindly

- Hardcoded team hardware names.
- Tuned PIDF, mass, wheel, and localizer constants.
- Old Pedro v1 package names when targeting Pedro v2.
- Blocking `sleep()` calls during active path following.
- Monolithic OpModes that combine hardware init, route planning, mechanism control, and tuning in one class.
- Any PathConstraints or dependency pattern without checking the exact Pedro version.

## Common generated-code checklist

For any FTC code an AI agent writes:

- Does every hardware name match the robot configuration?
- Is the OpMode annotated correctly with `@TeleOp` or `@Autonomous`?
- Does the code avoid using unavailable libraries unless Gradle dependencies are added?
- Does the robot stop motors/servos safely when the OpMode ends?
- Is the drive loop nonblocking?
- Is telemetry available for every sensor and state machine state?
- Can each subsystem be tested independently?
- Are units clear: inches vs ticks vs radians vs degrees?
- Is alliance/side mirroring handled explicitly?
- Can autonomous be interrupted safely?

## For Pedro specifically

- Confirm the Pedro version in Gradle.
- Confirm the coordinate system before generating paths.
- Confirm the localizer type and sensor offsets.
- Generate one simple path first.
- Add mechanism actions only after the path works.
- Prefer command/state-machine composition for parallel actions.

