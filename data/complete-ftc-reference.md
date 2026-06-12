# FTC + Pedro Pathing Complete Documentation

## Table of Contents
1. [Technical Gold - Key Gotchas](#technical-gold)
2. [AI Agent Guidance](#ai-agent-guidance)
3. [Analysis & Learning Path](#analysis)
4. [Verified Resources & Links](#verified-resources)
5. [Official Docs](#official-docs)
6. [Reddit Discussions](#reddit-discussions)

---

## Technical Gold {#technical-gold}

### GoBILDA Pinpoint Odometry Computer
- **The "Stuck in stop()" Bug**: A major pitfall where OpModes hang during the transition to `stop()`. This was traced to the `normalizeAngle` function within the Pinpoint library.
- **ESD Sensitivity**: The standalone processor is highly susceptible to Electrostatic Discharge (ESD). Teams reported sudden resets or communication losses mid-match due to static from the mats.
- **1000Hz Refresh Rate**: The internal processor runs localization at 1000Hz, meaning your code doesn't need to poll as frequently as traditional encoders to maintain high-precision tracking.
- **Integration**: Successfully integrated with Roadrunner and Pedro Pathing to provide low-latency pose updates.

### SparkFun OTOS (Optical Tracking Odometry Sensor)
- **Mounting Height (Critical)**: Must be mounted exactly 10mm (±1mm) from the floor. You must account for mat compression (the robot sinks into the foam); a sensor measured at 12mm in CAD might be 10mm on the actual field.
- **Maintenance**: Cleaning is non-negotiable. The lens must be wiped clear of dust and debris every few days, as even minor smudges cause significant orientation drift.
- **Calibration**: If the robot orientation is incorrect, first verify that the lens is clean and the mounting height is within the 1mm tolerance before adjusting software offsets.

### Pedro Pathing
- **Coordinate System**: Uses Forward = +X, Left = +Y. This is different from the standard math coordinate system (Forward = +Y, Right = +X) used by many other libraries.
- **PID Initial Value Bug**: A known issue where PID constants must be explicitly zeroed in `FollowerConstants`. If you don't overwrite the defaults with zeros initially, the library may use hidden values that cause violent oscillations.
- **The PathConstraints Crash**: A reported fatal bug where including the `PathConstraints` class in the constants file caused the Control Hub to stop detecting the battery or crash entirely. Recommended to avoid for now.
- **Offset Validation**: To check if your X/Y offsets are correct, rotate the robot in place. The center of rotation on the dashboard should stay stationary; a drift of 1–2 inches is considered normal.

### AprilTags & Vision (Limelight 3A)
- **Kalman Filtering**: Using a `PoseEstimator` to combine wheel-based odometry with vision data. This uses a Kalman Filter to "weight" vision data—trusting AprilTags more when close and less when the robot is moving fast.
- **Distance Logic**: Uses the formula $d = \\frac{(h_2-h_1)}{\\tan(a_1+a_2)}$ ($h_1$: lens height, $h_2$: tag height, $a_1$: mount angle, $a_2$: vertical offset `ty`).
- **Pose Transformation**: Instead of simple PID to a tag, use Homogeneous Coordinates to transform the tag's relative position into a field-centric target pose, then use a path follower to move there.

### Hardware Logic & Tools
- **Median Filtering for Color**: When detecting game elements (Samples), gather multiple Hue samples in a list and calculate the Median. This filters out "outliers" (noise/motion blur) better than a standard average.
- **HSV > RGB**: For color detection (Yellow/Neutral/Alliance), using Hue is significantly more stable under varying competition lighting than raw RGB values.
- **DashTuner Utility**: A custom `DashTuner.java` OpMode that allows live-tuning of up to 4 motors and 4 servos via the FTC Dashboard without having to recompile code between changes.

---

## AI Agent Guidance {#ai-agent-guidance}

### Code Structure Best Practices
Most successful FTC codebases separate robot code into:
- constants/config
- subsystems
- commands or actions
- OpModes
- autonomous route definitions
- tuning/test OpModes

The better repos avoid stuffing everything into one OpMode. The FTC 12527 code is especially useful because it shows Pedro Pathing integrated with command-based mechanisms, shooter alignment, vision, and autonomous drive commands.

### Pedro Pathing Implementation Rules
1. Add dependencies and repositories first.
2. Create a single constants/factory location for `Follower`.
3. Keep Pedro path creation separate from mechanism commands.
4. Call the follower update loop continuously.
5. Do not block the loop with long sleeps while following a path.
6. Treat localization as a dependency that must be proven before route tuning.
7. Keep field coordinate assumptions explicit in code comments/constants.
8. Use dashboard/panels drawing and telemetry every loop while tuning.

### Repo Patterns to Copy
- `AutoDriveCommand`: wrapper command around `Follower.followPath(...)` and completion checks.
- `AutoBrakeCommand`: holding or braking at a pose after a path.
- `Constants.createFollower(hardwareMap)`: factory pattern for Pedro setup.
- `Tuning.java`: separate test OpMode for localization, heading, velocity, and PIDF tuning.
- `PedroAutoSample`: small, readable autonomous path chain sample.
- `DashTuner`: dashboard-based hardware verification before writing full robot logic.

### Repo Patterns to Avoid
- Hardcoded team hardware names.
- Tuned PIDF, mass, wheel, and localizer constants.
- Old Pedro v1 package names when targeting Pedro v2.
- Blocking `sleep()` calls during active path following.
- Monolithic OpModes that combine hardware init, route planning, mechanism control, and tuning in one class.
- Any PathConstraints or dependency pattern without checking the exact Pedro version.

### Common Generated-Code Checklist
- [ ] Does every hardware name match the robot configuration?
- [ ] Is the OpMode annotated correctly with `@TeleOp` or `@Autonomous`?
- [ ] Does the code avoid using unavailable libraries unless Gradle dependencies are added?
- [ ] Does the robot stop motors/servos safely when the OpMode ends?
- [ ] Is the drive loop nonblocking?
- [ ] Is telemetry available for every sensor and state machine state?
- [ ] Can each subsystem be tested independently?
- [ ] Are units clear: inches vs ticks vs radians vs degrees?
- [ ] Is alliance/side mirroring handled explicitly?
- [ ] Can autonomous be interrupted safely?

### Pedro-Specific Checks
- Confirm the Pedro version in Gradle.
- Confirm the coordinate system before generating paths.
- Confirm the localizer type and sensor offsets.
- Generate one simple path first.
- Add mechanism actions only after the path works.
- Prefer command/state-machine composition for parallel actions.

---

## Analysis & Learning Path {#analysis}

### The Shortest Useful Path
1. Learn FTC SDK project structure: `FtcRobotController`, `TeamCode`, OpModes, hardware map names, telemetry, gamepad input.
2. Learn Java basics through LinearOpMode and Iterative OpMode examples.
3. Confirm robot hardware config works with simple motor, servo, IMU, and sensor tests.
4. Install Pedro Pathing through Quickstart, not copying random snippets.
5. Configure localization and drivetrain constants.
6. Tune localization before trying to tune path following.
7. Tune velocity, heading, zero-power acceleration, then PIDF/predictive behavior.
8. Build tiny autonomous paths first, then combine paths with mechanism actions and callbacks.

### Tuning Checklist
1. Confirm motor directions and encoder signs.
2. Confirm the localizer type matches actual hardware.
3. Confirm pose changes correctly when pushing robot.
4. Tune localization values first.
5. Tune heading control.
6. Tune velocity and acceleration limits.
7. Tune zero-power acceleration.
8. Tune translational, heading, and drive PIDF values.
9. Only then tune path-level behavior (constraints, callbacks).

### Common Failure Patterns
- Hardware map names don't match configuration.
- Left/right motor direction reversed.
- Encoder direction reversed.
- Localizer pose axes swapped.
- Robot mass is wrong.
- Teams tune PID before localization is trustworthy.
- Teams test complex paths before validating simple moves.
- Mechanism actions block the drive loop.
- Battery voltage changes behavior (aggressive feedforward).

---

## Verified Resources {#verified-resources}

### Official Documentation
- FTC Docs: https://ftc-docs.firstinspires.org/
- FTC SDK GitHub: https://github.com/FIRST-Tech-Challenge/FtcRobotController
- Pedro Pathing Docs: https://pedropathing.com/
- Road Runner Docs: https://rr.brott.dev/

### Top Verified Repositories
| Team | Pedro Files | RR Files | Description |
|------|-------------|----------|-------------|
| FTC-12527-FatDragon | 16 Java files | Hardware integrated | Command-based + Pedro |
| FTC-23511 | 36 Java files | Tuning tests | Full ITD season code |
| zihanpeter | 23 Pedro files | N/A | China Championship |
| GA-Moonshots | 55 Pedro files | 4 files | FTCLib + Pedro combo |
| RoboRacers | 61 Pedro files | 4 files | Road Runner migration |

---

## Official Documentation Links {#official-docs}

### FTC
- FTC programming: https://ftc-docs.firstinspires.org/programming_resources/
- Android Studio Java tutorial: https://ftc-docs.firstinspires.org/programming_resources/android_studio_java/
- OnBot Java tutorial: https://ftc-docs.firstinspires.org/programming_resources/onbot_java/

### Pedro Pathing
- Installation: https://pedropathing.com/docs/pathing/installation
- Constants: https://pedropathing.com/docs/pathing/constants
- Tuning: https://pedropathing.com/docs/pathing/tuning
- Pathing examples: https://pedropathing.com/docs/pathing/examples/auto
- Path builder reference: https://pedropathing.com/docs/pathing/reference/path-builder

---

## Reddit Discussions {#reddit-discussions}

### Troubleshooting Threads
- PedroPathing tuning error: /r/FTC/comments/1szcfqj/pedropathing_tuning_error/
- Strafe direction reversed: /r/FTC/comments/1p96y62/pedropathing_drive_help/
- Code appearing red after install: /r/FTC/comments/1p61v1j/pedro_pathing_help/
- Autonomous telemetry issues: /r/FTC/comments/1rgprsf/autonomous_telemetry_not_showing_up/
- Multitasking in auto: /r/FTC/comments/1pfz4h9/how_to_multitask_in_auto_with_pedropathing/
- Heading PIDF tuning: /r/FTC/comments/1p8atmu/issues_with_pedro_pathing_heading_pidf_tuning/