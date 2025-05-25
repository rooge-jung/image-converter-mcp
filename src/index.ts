import { MCPServer } from "mcp-framework";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirnameResolved = dirname(__filename) + "/dist";

const server = new MCPServer({
  basePath: __dirnameResolved,
});

server.start().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
