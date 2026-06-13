import { headers } from "next/headers";

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function Home() {
  const baseUrl = await getBaseUrl();
  const mcpUrl = `${baseUrl}/api/mcp`;

  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <h1 style={styles.title}>FTC Knowledge MCP Server</h1>
        <p style={styles.subtitle}>
          Remote context plugin for AI coding agents — FTC programming, Pedro
          Pathing, localization, templates, and verified team patterns.
        </p>
        <code style={styles.endpoint}>{mcpUrl}</code>
      </header>

      <section style={styles.section}>
        <h2>Pedro Path Visualizer</h2>
        <p>
          Official Pedro Pathing Visualizer (full UI) with AI bridge layer. Agents
          can control every feature via <code>window.__PEDRO_VISUALIZER__</code> or
          browser MCP.
        </p>
        <p>
          <a href={`${baseUrl}/visualizer`} style={{ color: "#2563eb" }}>
            Open Official Visualizer →
          </a>
        </p>
        <ul style={styles.list}>
          <li>
            <strong>ftc_begin_ftc_session</strong> — REQUIRED first call for any
            FTC coding task
          </li>
          <li>
            <strong>ftc_autonomous_workflow</strong> — REQUIRED when autonomous /
            auto / PathChain is mentioned
          </li>
          <li>
            <strong>ftc_list_mcp_tools</strong> — full tool catalog
          </li>
          <li>
            <strong>ftc_visualizer_create_path</strong> +{" "}
            <strong>ftc_visualizer_execute</strong> — official visualizer + export
          </li>
          <li>
            <strong>ftc_robot_context</strong> — hardware names before OpModes
          </li>
        </ul>
        <p style={styles.note}>
          See <code>AGENTS.md</code> and Cursor rule{" "}
          <code>.cursor/rules/ftc-mcp-required.mdc</code> for agent workflows.
        </p>
      </section>

      <section style={styles.section}>
        <h2>Connect from Cursor</h2>
        <p>
          Add this to your project or global{" "}
          <code>.cursor/mcp.json</code> (or Cursor Settings → MCP):
        </p>
        <pre style={styles.pre}>{`{
  "mcpServers": {
    "ftc-knowledge": {
      "url": "${mcpUrl}"
    }
  }
}`}</pre>
        <p style={styles.note}>
          If your Cursor version does not support remote URL MCP yet, use{" "}
          <code>mcp-remote</code>:
        </p>
        <pre style={styles.pre}>{`{
  "mcpServers": {
    "ftc-knowledge": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${mcpUrl}"]
    }
  }
}`}</pre>
      </section>

      <section style={styles.section}>
        <h2>Connect from Claude Code / Claude Desktop</h2>
        <p>
          Add to <code>~/.claude/claude_desktop_config.json</code> or your
          project MCP config:
        </p>
        <pre style={styles.pre}>{`{
  "mcpServers": {
    "ftc-knowledge": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${mcpUrl}"]
    }
  }
}`}</pre>
      </section>

      <section style={styles.section}>
        <h2>Available MCP Tools</h2>
        <ul style={styles.list}>
          <li>
            <strong>ftc_search_research</strong> — search notes, gotchas, docs,
            and verified resources
          </li>
          <li>
            <strong>ftc_get_template</strong> — FConstants, LConstants, Auto,
            Subsystem templates
          </li>
          <li>
            <strong>ftc_get_full_context</strong> — full context bundle for
            code generation
          </li>
          <li>
            <strong>ftc_get_patterns</strong> — pathing, localization, autos,
            teleop, tuning patterns
          </li>
          <li>
            <strong>ftc_get_team_examples</strong> — verified team repo index
          </li>
          <li>
            <strong>ftc_search_codebase</strong> — search high-signal Java
            files index
          </li>
        </ul>
      </section>

      <section style={styles.section}>
        <h2>REST API (direct HTTP access)</h2>
        <ul style={styles.list}>
          <li>
            <code>GET /api/context?action=info</code> — server info
          </li>
          <li>
            <code>GET /api/context?action=search&amp;q=pinpoint</code> — search
            corpus
          </li>
          <li>
            <code>GET /api/context?action=template&amp;type=fconstants</code> —
            get template
          </li>
          <li>
            <code>GET /api/context?action=context</code> — full context bundle
          </li>
          <li>
            <code>GET /api/context?action=patterns&amp;category=pathing</code> —
            get patterns
          </li>
          <li>
            <code>GET /api/context?action=teams</code> — team examples
          </li>
          <li>
            <code>GET /api/context?action=codebase&amp;pattern=Follower</code> —
            search codebase index
          </li>
        </ul>
      </section>

      <section style={styles.section}>
        <h2>Example Prompts (after connecting)</h2>
        <ul style={styles.list}>
          <li>
            &quot;Use ftc_get_full_context to load FTC context, then write an
            autonomous OpMode with Pedro Pathing&quot;
          </li>
          <li>
            &quot;Search ftc_search_research for the PID zeroing bug and fix my
            FConstants&quot;
          </li>
          <li>
            &quot;Use ftc_get_template with type fconstants for a Pinpoint
            mecanum setup&quot;
          </li>
          <li>
            &quot;Use ftc_get_patterns for localization tuning with OTOS&quot;
          </li>
        </ul>
      </section>

      <footer style={styles.footer}>
        <p>
          Corpus includes technical gold notes, AI agent guidance, Pedro
          Pathing patterns, code templates, verified team repos, and official
          doc links.
        </p>
      </footer>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    maxWidth: 820,
    margin: "0 auto",
    padding: "48px 24px 80px",
    lineHeight: 1.6,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    margin: "0 0 12px",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: 17,
    color: "#444",
    margin: "0 0 16px",
  },
  endpoint: {
    display: "inline-block",
    background: "#f4f4f5",
    padding: "8px 14px",
    borderRadius: 8,
    fontSize: 14,
    wordBreak: "break-all" as const,
  },
  section: {
    marginBottom: 36,
  },
  pre: {
    background: "#18181b",
    color: "#fafafa",
    padding: 16,
    borderRadius: 10,
    overflow: "auto",
    fontSize: 13,
    lineHeight: 1.5,
  },
  list: {
    paddingLeft: 20,
  },
  note: {
    fontSize: 14,
    color: "#666",
  },
  footer: {
    borderTop: "1px solid #e4e4e7",
    paddingTop: 24,
    fontSize: 14,
    color: "#666",
  },
};
