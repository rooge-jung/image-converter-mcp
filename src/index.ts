#!/usr/bin/env node
import express, { Request, Response } from "express";
import multer from "multer";
import PngToWebpTool, { PngToWebpInput } from "./tools/PngToWebpTool.js"; // PngToWebpInput 임포트
import PngFileToWebpTool, {
  PngFileToWebpInput,
} from "./tools/PngFileToWebpTool.js"; // PngFileToWebpInput 임포트
import { GetWebpFromPngPrompt } from "./prompts/GetWebpFromPngPrompt.js";
import { GetWebpFromBase64PngPrompt } from "./prompts/GetWebpFromBase64PngPrompt.js";
import { GetWebpFromPngFilePrompt } from "./prompts/GetWebpFromPngFilePrompt.js";
import { z } from "zod";

const app = express();
const port = parseInt(process.env.PORT ?? "10000", 10); // Default to 10000 as per memory

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const pngToWebpTool = new PngToWebpTool();
const pngFileToWebpTool = new PngFileToWebpTool();

const getWebpFromPngPrompt = new GetWebpFromPngPrompt();
const getWebpFromBase64PngPrompt = new GetWebpFromBase64PngPrompt();
const getWebpFromPngFilePrompt = new GetWebpFromPngFilePrompt();

const tools = [pngToWebpTool, pngFileToWebpTool]; // This line might have been duplicated or misplaced by previous edits, ensure it's correctly placed before use.
const prompts = [
  getWebpFromPngPrompt,
  getWebpFromBase64PngPrompt,
  getWebpFromPngFilePrompt,
]; // Define prompts array

app.post("/api/png_to_webp", async (req: Request, res: Response) => {
  try {
    // validatedInput에 명시적 타입 PngToWebpInput 지정
    // pngToWebpTool.schema가 이제 Zod 스키마 객체이므로 직접 사용
    const validatedInput: PngToWebpInput = pngToWebpTool.schema.parse(req.body);
    const result = await pngToWebpTool.execute(validatedInput);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({
          success: false,
          error: "Invalid input",
          details: error.errors,
        });
    } else if (error instanceof Error) {
      console.error("Error in /api/png_to_webp:", error.message);
      res.status(500).json({ success: false, error: error.message });
    } else {
      console.error("Unknown error in /api/png_to_webp:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
});

app.post(
  "/api/png_file_to_webp",
  upload.single("imageFile"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res
          .status(400)
          .json({ success: false, error: "'imageFile' is required." });
        return;
      }
      // pngFileToWebpTool.schema가 이제 Zod 스키마 객체이므로 직접 사용
      const validatedInput: PngFileToWebpInput = pngFileToWebpTool.schema.parse(
        req.body
      );

      const result = await pngFileToWebpTool.execute(validatedInput, {
        customContext: req,
      });
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({
            success: false,
            error: "Invalid input",
            details: error.errors,
          });
      } else if (error instanceof Error) {
        console.error("Error in /api/png_file_to_webp:", error.message);
        res.status(500).json({ success: false, error: error.message });
      } else {
        console.error("Unknown error in /api/png_file_to_webp:", error);
        res
          .status(500)
          .json({ success: false, error: "Internal server error" });
      }
    }
  }
);

// Helper function to process a single Zod field schema
function processZodField(fieldSchema: z.ZodTypeAny): {
  propertyInfo: any;
  isOptional: boolean;
  finalSchema: z.ZodTypeAny;
} {
  let currentSchema = fieldSchema;
  const propertyInfo: any = {};
  let isOptional = false;

  // 1. Check for ZodOptional
  if (
    currentSchema instanceof z.ZodOptional ||
    currentSchema._def.typeName === "ZodOptional"
  ) {
    isOptional = true;
    currentSchema = (currentSchema as z.ZodOptional<any>).unwrap();
  }

  // 2. Check for ZodDefault (after unwrap if optional)
  if (
    currentSchema instanceof z.ZodDefault ||
    currentSchema._def.typeName === "ZodDefault"
  ) {
    propertyInfo.default = (
      currentSchema as z.ZodDefault<any>
    )._def.defaultValue();
    currentSchema = (currentSchema as z.ZodDefault<any>)._def.innerType;
  }

  // 3. Determine type based on the (potentially unwrapped) schema
  if (currentSchema instanceof z.ZodString) {
    propertyInfo.type = "string";
  } else if (currentSchema instanceof z.ZodNumber) {
    propertyInfo.type = "number";
  } else if (currentSchema instanceof z.ZodBoolean) {
    propertyInfo.type = "boolean";
  } else {
    // Fallback for other Zod types, using the constructor name
    propertyInfo.type = currentSchema.constructor.name
      .replace(/^Zod/, "")
      .toLowerCase();
    if (propertyInfo.type === "object" || propertyInfo.type === "array") {
      // For nested objects or arrays, you might want to recursively call zodSchemaToDiscoveryJson
      // or represent them as a generic 'object' or 'array' type for simplicity here.
      // For now, just marking as 'object' or 'array'.
      // console.warn(`Complex type ${propertyInfo.type} found for field. Consider enhancing schema conversion.`);
    }
  }

  // 4. Get description if available (from the final unwrapped schema)
  if (currentSchema.description) {
    propertyInfo.description = currentSchema.description;
  }

  if (isOptional) {
    propertyInfo.optional = true; // Explicitly mark optional fields in the output
  }

  return { propertyInfo, isOptional, finalSchema: currentSchema };
}

// Helper to convert Zod schema to a simplified JSON schema for discovery
function zodSchemaToDiscoveryJson(zodSchema: z.ZodTypeAny): any {
  if (!(zodSchema instanceof z.ZodObject)) {
    return {
      type: "error",
      message:
        "Only ZodObject schemas are currently supported for detailed discovery.",
    };
  }

  const shape = (zodSchema as z.ZodObject<any, any>).shape;
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const key in shape) {
    if (Object.hasOwn(shape, key)) {
      const fieldSchema = shape[key] as z.ZodTypeAny;
      const { propertyInfo, isOptional } = processZodField(fieldSchema);

      properties[key] = propertyInfo;

      if (!isOptional) {
        required.push(key);
      }
    }
  }

  return {
    type: "object",
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

// MCP Discover Endpoint
app.get("/mcp/discover", (req, res) => {
  try {
    // tools and prompts arrays are defined globally near the top of the file
    res.json({
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: zodSchemaToDiscoveryJson(
          tool.schema as z.ZodObject<any, any, any>
        ),
      })),
      resources: [], // Add resource discovery later if needed
      prompts: prompts.map((prompt) => ({
        name: prompt.name,
        description: prompt.description,
        inputSchema: zodSchemaToDiscoveryJson(
          prompt.schema as z.ZodObject<any, any, any>
        ),
      })),
    });
  } catch (error) {
    console.error("Error in /mcp/discover:", error);
    if (error instanceof Error) {
      res
        .status(500)
        .json({
          error: "Failed to discover tools/prompts.",
          message: error.message,
          stack: error.stack,
        });
    } else {
      res
        .status(500)
        .json({
          error: "Failed to discover tools/prompts.",
          message: String(error),
        });
    }
  }
});

// MCP Execute Endpoint
app.post(
  "/mcp/execute",
  upload.single("imageFile"),
  async (req: Request, res: Response) => {
    const { toolName, input: rawInput } = req.body;

    // PngFileToWebpTool의 경우, input이 JSON 문자열로 올 수 있으므로 파싱 시도
    let input = rawInput;
    if (toolName === "PngFileToWebpTool" && typeof rawInput === "string") {
      try {
        input = JSON.parse(rawInput);
      } catch (e) {
        res
          .status(400)
          .json({
            success: false,
            error: "Invalid JSON input for PngFileToWebpTool",
          });
        return; // Explicitly return to avoid further execution in this case
      }
    }

    try {
      let result;
      switch (toolName) {
        case "PngToWebpTool": {
          const validatedPngToWebpInput: PngToWebpInput =
            pngToWebpTool.schema.parse(input);
          result = await pngToWebpTool.execute(validatedPngToWebpInput);
          break;
        }
        case "PngFileToWebpTool": {
          if (!req.file) {
            res
              .status(400)
              .json({
                success: false,
                error: "'imageFile' is required for PngFileToWebpTool.",
              });
            return;
          }
          // req.body에는 quality, lossless, animated 등이 포함될 수 있음
          const validatedPngFileToWebpInput: PngFileToWebpInput =
            pngFileToWebpTool.schema.parse(input ?? {}); // input이 없을 경우 빈 객체로 파싱 시도
          result = await pngFileToWebpTool.execute(
            validatedPngFileToWebpInput,
            { customContext: req }
          );
          break;
        }
        default: {
          res
            .status(400)
            .json({ success: false, error: `Unknown tool: ${toolName}` });
          return;
        }
      }
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({
            success: false,
            error: "Invalid input",
            details: error.errors,
          });
      } else if (error instanceof Error) {
        console.error(`Error in /mcp/execute (${toolName}):`, error.message);
        res.status(500).json({ success: false, error: error.message });
      } else {
        console.error(`Unknown error in /mcp/execute (${toolName}):`, error);
        res
          .status(500)
          .json({ success: false, error: "Internal server error" });
      }
    }
  }
);

// Function to create a server starter with port conflict resolution
function createStartServer(appInstance: express.Express) {
  const MAX_ATTEMPTS = 100; // Max attempts to find a port

  return function startServerInstance(initialPortToTry: number) {
    let currentPortToTry = initialPortToTry;
    let attempts = 0;

    const attemptListen = () => {
      if (attempts >= MAX_ATTEMPTS) {
        console.error(
          `Failed to start server after ${MAX_ATTEMPTS} attempts. Last port tried: ${
            currentPortToTry - 1
          }.`
        );
        process.exit(1); // Exit if no port is found
        return;
      }

      appInstance
        .listen(currentPortToTry, () => {
          console.log(
            `Image Converter server running on http://localhost:${currentPortToTry}`
          );
        })
        .on("error", (err: any) => {
          if (err.code === "EADDRINUSE") {
            attempts++;
            currentPortToTry++;
            attemptListen();
          } else {
            console.error(
              `Failed to start server on port ${currentPortToTry}:`,
              err
            );
            process.exit(1); // Exit on other errors
          }
        });
    };
    attemptListen();
  };
}

const serverStarter = createStartServer(app);
serverStarter(port); // 'port' is from the top of the file
