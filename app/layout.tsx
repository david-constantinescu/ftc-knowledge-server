import "./globals.css";

export const metadata = {
  title: "FTC Knowledge MCP Server",
  description:
    "Remote MCP server for FTC + Pedro Pathing research — connect from Cursor, Claude Code, or any MCP client",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
