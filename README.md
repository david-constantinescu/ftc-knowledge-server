# ftc-knowledge-server

Remote **MCP (Model Context Protocol) server** for FTC + Pedro Pathing research. Deploy on Vercel and connect from **Cursor**, **Claude Code**, **Claude Desktop**, or any MCP-compatible AI agent.

## What's included

- Technical gold notes (Pinpoint, OTOS, Pedro gotchas)
- AI agent code generation guidance
- Pedro Pathing patterns (pathing, localization, autos, teleop, tuning)
- Java code templates (FConstants, LConstants, Auto, Subsystem)
- Verified team repository index
- High-signal Java file index
- Official docs and community links

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/david-constantinescu/ftc-knowledge-server)

Or manually:

```bash
npm install
npm run build
npx vercel --prod
```

## Connect to Cursor

Add to `.cursor/mcp.json` in your project (or Cursor Settings → MCP):

```json
{
  "mcpServers": {
    "ftc-knowledge": {
      "url": "https://YOUR-DEPLOYMENT.vercel.app/api/mcp"
    }
  }
}
```

If your Cursor version doesn't support remote URL MCP yet:

```json
{
  "mcpServers": {
    "ftc-knowledge": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://YOUR-DEPLOYMENT.vercel.app/api/mcp"]
    }
  }
}
```

Restart Cursor after saving. The AI can now call tools like `ftc_get_full_context` and `ftc_search_research`.

## Connect to Claude Code / Claude Desktop

Add to `~/.claude/claude_desktop_config.json` or project MCP config:

```json
{
  "mcpServers": {
    "ftc-knowledge": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://YOUR-DEPLOYMENT.vercel.app/api/mcp"]
    }
  }
}
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `ftc_search_research` | Search notes, gotchas, docs, verified resources |
| `ftc_get_template` | Get FConstants, LConstants, Auto, Subsystem templates |
| `ftc_get_full_context` | Full context bundle for code generation |
| `ftc_get_patterns` | Patterns by category (pathing, localization, etc.) |
| `ftc_get_team_examples` | Verified team repo index |
| `ftc_search_codebase` | Search high-signal Java files index |

## REST API

For apps that can't use MCP directly:

```
GET /api/context?action=info
GET /api/context?action=search&q=pinpoint
GET /api/context?action=template&type=fconstants
GET /api/context?action=context
GET /api/context?action=patterns&category=pathing
GET /api/context?action=teams
GET /api/context?action=codebase&pattern=Follower
```

## Example prompts (after connecting)

```
Use ftc_get_full_context to load FTC context, then write an autonomous OpMode with Pedro Pathing.

Search ftc_search_research for the PID zeroing bug and fix my FConstants.

Use ftc_get_template with type fconstants for a Pinpoint mecanum setup.
```

## Local development

```bash
npm install
npm run dev
# MCP endpoint: http://localhost:3000/api/mcp
# Landing page: http://localhost:3000
```

## License

Research corpus compiled from public FTC/Pedro Pathing sources. Use for educational and team programming purposes.
