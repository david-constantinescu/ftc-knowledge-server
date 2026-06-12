# Analysis: FTC Programming + Pedro Pathing

## The shortest useful path

For a team trying to program FTC autonomous with Pedro Pathing, the right learning order is:

1. Learn the FTC SDK project structure: `FtcRobotController`, `TeamCode`, OpModes, hardware map names, telemetry, and gamepad input.
2. Learn Java basics through LinearOpMode and Iterative OpMode examples.
3. Confirm the robot hardware config works with simple motor, servo, IMU, and sensor tests.
4. Install Pedro Pathing through the Quickstart, not by copying random snippets.
5. Configure localization and drivetrain constants.
6. Tune localization before trying to tune path following.
7. Tune velocity, heading, zero-power acceleration, then PIDF/predictive behavior.
8. Build tiny autonomous paths first, then combine paths with mechanism actions and callbacks.

## High-value official FTC docs

The FTC docs matter because Pedro Pathing runs inside the normal FTC SDK. The SDK rules still control everything:

- OpModes are the unit of robot code that appears on the Driver Station.
- Hardware names in code must exactly match the robot configuration.
- Android Studio is the normal long-term workflow for teams that want libraries such as Pedro Pathing.
- OnBot Java is good for learning, but third-party library work is usually easier in Android Studio.
- Sample OpModes in the SDK are worth reading because they demonstrate FTC-approved patterns for motors, servos, IMUs, cameras, AprilTags, telemetry, and gamepads.

Best local code samples:

- `github/FtcRobotController-master/FtcRobotController/src/main/java/org/firstinspires/ftc/robotcontroller/external/samples/`
- `github/FtcRobotController-master/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/readme.md`

## What Pedro Pathing is for

Pedro Pathing is an FTC path-following library for autonomous movement. It is useful when your robot needs repeatable field-relative movement, smoother autonomous paths, and more flexible path construction than timed or encoder-only driving.

Do not start with complex paths. Start with:

- straight line
- strafe
- turn/heading hold
- one Bezier curve
- one path with a callback
- a full autonomous only after localization is stable

## Main Pedro concepts

- `Follower`: the runtime object that follows paths.
- `Pose`: robot position and heading on the field.
- `Path`: a movement segment, often using Bezier curves.
- `PathChain`: multiple paths chained together.
- `Constants`: drivetrain, localizer, motor direction, mass, and tuning values.
- Localization: the system estimating where the robot is. Bad localization makes all path tuning misleading.
- Callbacks: actions triggered while driving, useful for moving mechanisms during autonomous.

## Tuning checklist

1. Confirm motor directions and encoder signs.
2. Confirm the localizer type matches the actual hardware, such as dead wheels, Pinpoint, OTOS, or custom localization.
3. Confirm pose changes correctly when pushing the robot by hand.
4. Tune localization values first.
5. Tune heading control.
6. Tune velocity and acceleration limits.
7. Tune zero-power acceleration.
8. Tune translational, heading, and drive PIDF values.
9. Only then tune path-level behavior such as deceleration, constraints, and callbacks.

## Common failure patterns

- Hardware map names do not match the Driver Station robot configuration.
- Left/right motor direction is reversed.
- Encoder direction is reversed.
- Localizer pose axes are swapped.
- Robot mass is wrong.
- Teams tune PID before localization is trustworthy.
- Teams test a complicated autonomous path before validating simple straight and strafe moves.
- Mechanism actions block the drive loop instead of running as timed/nonblocking actions.
- Battery voltage changes behavior because feedforward and acceleration limits are too aggressive.

## Pedro Pathing vs Road Runner

Road Runner has a longer history and larger ecosystem. Pedro Pathing has been gaining FTC usage because teams report an approachable quickstart, active support, and good docs around tuning. For a new team, the choice should be based on mentor familiarity and how quickly students can tune and debug the localizer.

If nobody on the team knows either, Pedro Pathing is a reasonable choice if you are willing to follow the docs exactly and keep the first autos small.

## Recommended team workflow

- One student owns drivetrain and localization.
- One student owns mechanism code.
- One student owns autonomous route planning.
- One student owns testing notes and version control.

Keep a tuning log with:

- robot weight
- wheel type
- motor RPM
- localizer type
- constants changed
- what test was run
- observed overshoot/drift
- battery voltage

This prevents random tuning changes from turning into guesswork.

