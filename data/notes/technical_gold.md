# FTC Technical Gold - Into The Deep (2024-2025)

## 1. GoBILDA Pinpoint Odometry Computer
*   **The "Stuck in stop()" Bug**: A major pitfall where OpModes hang during the transition to `stop()`. This was traced to the `normalizeAngle` function within the Pinpoint library.
*   **ESD Sensitivity**: The standalone processor is highly susceptible to **Electrostatic Discharge (ESD)**. Teams reported sudden resets or communication losses mid-match due to static from the mats.
*   **1000Hz Refresh Rate**: The internal processor runs localization at 1000Hz, meaning your code doesn't need to poll as frequently as traditional encoders to maintain high-precision tracking.
*   **Integration**: Successfully integrated with Roadrunner and Pedro Pathing to provide low-latency pose updates.

## 2. SparkFun OTOS (Optical Tracking Odometry Sensor)
*   **Mounting Height (Critical)**: Must be mounted exactly **10mm (±1mm)** from the floor. You must account for **mat compression** (the robot sinks into the foam); a sensor measured at 12mm in CAD might be 10mm on the actual field.
*   **Maintenance**: Cleaning is non-negotiable. The lens must be wiped clear of dust and debris every few days, as even minor smudges cause significant orientation drift.
*   **Calibration**: If the robot orientation is incorrect, first verify that the lens is clean and the mounting height is within the 1mm tolerance before adjusting software offsets.

## 3. Pedro Pathing
*   **Coordinate System**: Uses a specific setup: **Forward = +X, Left = +Y**. This is different from the standard math coordinate system (Forward = +Y, Right = +X) used by many other libraries.
*   **PID Initial Value Bug**: A known issue where PID constants must be **explicitly zeroed** in `FollowerConstants`. If you don't overwrite the defaults with zeros initially, the library may use hidden values that cause violent oscillations.
*   **The PathConstraints Crash**: A reported fatal bug where including the `PathConstraints` class in the constants file caused the Control Hub to stop detecting the battery or crash entirely. Recommended to avoid for now.
*   **Offset Validation**: To check if your X/Y offsets are correct, rotate the robot in place. The center of rotation on the dashboard should stay stationary; a drift of 1–2 inches is considered normal.

## 4. AprilTags & Vision (Limelight 3A)
*   **Kalman Filtering**: Using a `PoseEstimator` to combine wheel-based odometry with vision data. This uses a Kalman Filter to "weight" vision data—trusting AprilTags more when close and less when the robot is moving fast.
*   **Distance Logic**: Uses the formula $d = \frac{(h_2-h_1)}{\tan(a_1+a_2)}$ ($h_1$: lens height, $h_2$: tag height, $a_1$: mount angle, $a_2$: vertical offset `ty`).
*   **Pose Transformation**: Instead of simple PID to a tag, use **Homogeneous Coordinates** to transform the tag's relative position into a field-centric target pose, then use a path follower to move there.

## 5. Hardware Logic & Tools
*   **Median Filtering for Color**: When detecting game elements (Samples), gather multiple Hue samples in a list and calculate the **Median**. This filters out "outliers" (noise/motion blur) better than a standard average.
*   **HSV > RGB**: For color detection (Yellow/Neutral/Alliance), using **Hue** is significantly more stable under varying competition lighting than raw RGB values.
*   **DashTuner Utility**: A custom `DashTuner.java` OpMode that allows live-tuning of up to 4 motors and 4 servos via the FTC Dashboard without having to recompile code between changes.
