export type PatternCategory =
  | "pathing"
  | "commands"
  | "localization"
  | "autos"
  | "teleop"
  | "tuning"
  | "hardware";

export const patterns: Record<PatternCategory, string> = {
  pathing: `## Pedro Pathing Patterns

**Follower Loop (required every OpMode):**
\`\`\`java
@Override
public void loop() {
    follower.update();
    autonomousPathUpdate();
    telemetry.update();
}
\`\`\`

**Path State Machine:**
\`\`\`java
private int pathState;
private void setPathState(int pState) {
    pathState = pState;
    pathTimer.resetTimer();
}
private void autonomousPathUpdate() {
    switch(pathState) {
        case 0: // follow path, setPathState(1); break;
        case 1: // check position, setPathState(2); break;
    }
}
\`\`\`

**PathChain with Hold (for parallel actions):**
\`\`\`java
follower.followPath(pathChain, true); // holds endpoint during mechanism actions
\`\`\`

**Coordinate System:**
- Pedro uses Forward = +X, Left = +Y
- Into The Deep field: 0-144 inches (bottom-left to top-right)
- Poses: new Pose(x, y, headingRadians)
- PathVisualizer: https://pedro-path-generator.vercel.app/`,

  commands: `## Command Pattern (FTCLib + Pedro)

**AutoDriveCommand:**
\`\`\`java
public class AutoDriveCommand extends CommandBase {
    private Follower follower;
    private PathChain pathChain;
    private double waitTime;
    private final ElapsedTime timer;

    public AutoDriveCommand(Follower follower, PathChain pathChain) {
        this.follower = follower;
        this.pathChain = pathChain;
        this.waitTime = 30000;
        this.timer = new ElapsedTime();
    }

    @Override
    public void initialize() {
        timer.reset();
        follower.followPath(pathChain);
    }

    @Override
    public void end(boolean interrupted) {
        follower.breakFollowing();
    }

    @Override
    public boolean isFinished() {
        return !follower.isBusy() || timer.milliseconds() >= waitTime;
    }
}
\`\`\`

**Sequential Command Group:**
\`\`\`java
new SequentialCommandGroup(
    new AutoDriveCommand(follower, path1),
    new SetServoCommand(servo, 0.5),
    new AutoDriveCommand(follower, path2)
);
\`\`\``,

  localization: `## Localization Patterns

**Pinpoint Offset Validation:**
- Rotate robot in place
- Center of rotation on dashboard should stay stationary
- Drift of 1-2 inches is normal

**OTOS Mounting:**
- Height: 10mm (±1mm) from floor
- Account for mat compression
- Clean lens daily - smudges cause drift

**Localizer Types:**
- THREE_DEAD_WHEEL: encoders in X, Y, strafe
- TWO_DEAD_WHEEL: encoders in X, strafe
- PINPOINT: GoBILDA odometry computer
- OTOS: SparkFun optical tracking sensor`,

  autos: `## Autos Patterns (Into The Deep)

**0+4 Specimen + Sample Auto:**
1. Score preload in bucket/submersible
2. Grab sample 1, score
3. Grab sample 2, score
4. Grab sample 3, score
5. Park

**Path Building Order:**
1. Build all paths in init() before match
2. Use pathBuilder().addPath() for pathchains
3. Linear interpolation for most turns
4. Test paths individually before combining

**Path Constraints:**
PathConstraints class has known bug - causes Control Hub crash. Leave commented out.`,

  teleop: `## TeleOp Patterns

**Field-Centric Drive:**
\`\`\`java
double y = -gamepad1.left_stick_y;
double x = gamepad1.left_stick_x;
double rx = gamepad1.right_stick_x;
double denominator = Math.max(Math.abs(y) + Math.abs(x) + Math.abs(rx), 1);
double leftFrontPower = (y + x + rx) / denominator;
\`\`\`

**Pose Tracking:**
- Use PoseUpdater for manual control
- Reset pose on init if needed
- Display heading in degrees for drivers`,

  tuning: `## Tuning Patterns

**Tuning Order:**
1. Motor directions + encoder signs
2. Localizer type matches hardware
3. Pose changes when pushing robot
4. Localization tuning (mass, velocity, acceleration)
5. Heading control
6. Translational PIDF
7. Drive PIDF

**Tuners:**
- ForwardVelocityTuner: max speed forward
- StrafeVelocityTuner: max speed strafe
- ForwardZeroPowerAccelerationTuner: decel forward
- LateralZeroPowerAccelerationTuner: decel strafe
- LocalizationTest: manual pose verification

**Dashboard:** http://192.168.43.1:8080/dash`,

  hardware: `## Hardware Patterns

**Motor Safety:**
\`\`\`java
motor.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);
motor.setDirection(DcMotorSimple.Direction.REVERSE);
\`\`\`

**Servo Control:**
\`\`\`java
servo.setPosition(0.5); // 0-1 range
\`\`\`

**Pinpoint ESD:**
- Ground robot before handling
- Store spare Pinpoint
- Check for normalizeAngle bug in stop()

**OTOS Lens:**
- Clean daily with lens cloth
- 10mm mounting height critical`,
};

export function getPattern(category: PatternCategory): string {
  return patterns[category] ?? patterns.pathing;
}
