import { existsSync } from "fs";
import { execSync } from "child_process";

const out = "public/official-visualizer/index.html";

if (existsSync(out)) {
  console.log("[visualizer] Pre-built assets found, skipping vendor build.");
  process.exit(0);
}

const vendorPkg = "vendor/pedro-visualizer/package.json";
if (!existsSync(vendorPkg)) {
  console.error(
    "[visualizer] ERROR: No pre-built visualizer and vendor/pedro-visualizer missing."
  );
  process.exit(1);
}

console.log("[visualizer] Building from vendor/pedro-visualizer...");
execSync("cd vendor/pedro-visualizer && npm install && npm run build", {
  stdio: "inherit",
});
