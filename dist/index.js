#!/usr/bin/env node
import { MCPServer } from "mcp-framework";
const server = new MCPServer({
    name: "image-converter-mcp",
    version: "1.1.5",
});
server.start();
