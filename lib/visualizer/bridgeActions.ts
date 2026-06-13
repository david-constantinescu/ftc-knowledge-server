/** Mirrors vendor/pedro-visualizer/src/ai/bridge.ts AI_ACTION_CATALOG */
export const VISUALIZER_BRIDGE_ACTIONS = [
  "getState",
  "loadState",
  "loadPpJson",
  "getShareUrl",
  "listActions",
  "getSnapshot",
  "click",
  "play",
  "pause",
  "togglePlay",
  "resetAnimation",
  "seek",
  "undo",
  "redo",
  "addPath",
  "addControlPoint",
  "removeControlPoint",
  "optimizeLine",
  "optimizeAll",
  "exportJava",
  "exportPpJson",
  "exportGif",
  "setStartPoint",
  "updateLine",
  "toggleGrid",
  "toggleSnapToGrid",
  "cycleGridSize",
  "toggleRuler",
  "toggleProtractor",
  "updateSettings",
  "setLoopAnimation",
] as const;

export type VisualizerBridgeAction = (typeof VISUALIZER_BRIDGE_ACTIONS)[number];

export function bridgeHelp(baseUrl: string) {
  return `# Official Pedro Pathing Visualizer — AI Bridge

The hosted visualizer at \`${baseUrl}/official-visualizer/index.html\` is the **official Pedro-Pathing/Visualizer** app (Svelte + Two.js) with an AI bridge layer.

## Browser control (full parity with human UI)

1. Open the visualizer URL (use \`shareUrl\` from MCP tools — includes ?data= state).
2. Wait for \`window.__PEDRO_VISUALIZER__\` (or event \`pedro-visualizer-ready\`).
3. Run actions programmatically:

\`\`\`javascript
await window.__PEDRO_VISUALIZER__.execute("getSnapshot");
await window.__PEDRO_VISUALIZER__.execute("addPath");
await window.__PEDRO_VISUALIZER__.execute("exportJava", { mode: "class" });
await window.__PEDRO_VISUALIZER__.execute("optimizeAll");
await window.__PEDRO_VISUALIZER__.execute("click", { selector: '[data-ai-action="file-manager"]' });
\`\`\`

## Available actions

${VISUALIZER_BRIDGE_ACTIONS.map((a) => `- \`${a}\``).join("\n")}

## DOM selectors (for click() fallback)

- \`[data-ai-action="play-pause"]\` — play/pause animation
- \`[data-ai-action="file-manager"]\` — file manager
- \`[data-ai-action="optimize-all"]\` — optimize all paths
- \`[data-ai-action="undo"]\` / \`[data-ai-action="redo"]\`
- \`[data-ai-action="add-path"]\` — add path in control panel

## Cursor browser MCP workflow

1. \`browser_navigate\` → shareUrl
2. \`browser_wait\` until \`window.__PEDRO_VISUALIZER__\` exists (CDP evaluate)
3. \`Runtime.evaluate\` → \`await window.__PEDRO_VISUALIZER__.execute(...)\`

Prefer \`execute()\` over pixel clicks — covers export, optimize, undo, settings, and full .pp state.

## Official features included

File manager, drag editing, Bezier control points, path chains, waits, obstacles, grid/ruler/protractor, optimize, GIF/PNG/Java export, alliance mirror, settings, time prediction — identical to https://visualizer.pedropathing.com
`;
}

export function buildBridgeInvocation(
  baseUrl: string,
  action: string,
  params?: Record<string, unknown>,
  shareUrl?: string
) {
  return {
    visualizerUrl: shareUrl ?? `${baseUrl}/official-visualizer/index.html`,
    action,
    params: params ?? {},
    javascript: `window.__PEDRO_VISUALIZER__.execute(${JSON.stringify(action)}, ${JSON.stringify(params ?? {})})`,
    note: "Run javascript via browser CDP after navigating to visualizerUrl. Bridge must be ready (~1s after load).",
  };
}
