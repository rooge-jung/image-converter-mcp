#!/usr/bin/env node
import express, { Request, Response } from 'express';
import multer from 'multer';
import PngToWebpTool, { PngToWebpInput } from './tools/PngToWebpTool.js'; // PngToWebpInput 임포트
import PngFileToWebpTool, { PngFileToWebpInput } from './tools/PngFileToWebpTool.js'; // PngFileToWebpInput 임포트
import { z } from "zod";

const app = express();
const port = parseInt(process.env.PORT ?? '10000', 10); // Default to 10000 as per memory

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const pngToWebpTool = new PngToWebpTool();
const pngFileToWebpTool = new PngFileToWebpTool();

app.post('/api/png_to_webp', async (req: Request, res: Response) => {
  try {
    // validatedInput에 명시적 타입 PngToWebpInput 지정
    // pngToWebpTool.schema가 이제 Zod 스키마 객체이므로 직접 사용
    const validatedInput: PngToWebpInput = pngToWebpTool.schema.parse(req.body);
    const result = await pngToWebpTool.execute(validatedInput);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Invalid input', details: error.errors });
    } else if (error instanceof Error) {
      console.error('Error in /api/png_to_webp:', error.message);
      res.status(500).json({ success: false, error: error.message });
    } else {
      console.error('Unknown error in /api/png_to_webp:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

app.post('/api/png_file_to_webp', upload.single('imageFile'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: "'imageFile' is required." });
      return; 
    }
    // pngFileToWebpTool.schema가 이제 Zod 스키마 객체이므로 직접 사용
    const validatedInput: PngFileToWebpInput = pngFileToWebpTool.schema.parse(req.body);
    
    const result = await pngFileToWebpTool.execute(validatedInput, { customContext: req });
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Invalid input', details: error.errors });
    } else if (error instanceof Error) {
      console.error('Error in /api/png_file_to_webp:', error.message);
      res.status(500).json({ success: false, error: error.message });
    } else {
      console.error('Unknown error in /api/png_file_to_webp:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

// Helper to convert Zod schema to a simplified JSON schema for discovery
function zodSchemaToDiscoveryJson(zodSchema: z.ZodTypeAny): any {
  if (!(zodSchema instanceof z.ZodObject)) {
    // For non-object schemas, or if you want to represent them differently
    return { type: 'error', message: 'Only ZodObject schemas are currently supported for detailed discovery.' };
  }

  const shape = (zodSchema as z.ZodObject<any, any>).shape;
  const properties: Record<string, any> = {};
  let required: string[] = []; // Initialize required as an empty array

  for (const key in shape) {
    if (Object.hasOwn(shape, key)) {
      let fieldSchema = shape[key] as z.ZodTypeAny;
      const property: any = {};
      let isOptional = false;

      // Check for optional
      if (fieldSchema instanceof z.ZodOptional || fieldSchema._def.typeName === 'ZodOptional') {
        isOptional = true;
        fieldSchema = (fieldSchema as z.ZodOptional<any>).unwrap();
      }

      // Check for default (after unwrap if optional)
      if (fieldSchema instanceof z.ZodDefault || fieldSchema._def.typeName === 'ZodDefault') {
        property.default = (fieldSchema as z.ZodDefault<any>)._def.defaultValue();
        fieldSchema = (fieldSchema as z.ZodDefault<any>)._def.innerType;
      }
      
      // Determine type
      if (fieldSchema instanceof z.ZodString) {
        property.type = 'string';
      } else if (fieldSchema instanceof z.ZodNumber) {
        property.type = 'number';
      } else if (fieldSchema instanceof z.ZodBoolean) {
        property.type = 'boolean';
      } else {
        // Fallback for other Zod types
        property.type = fieldSchema.constructor.name.replace(/^Zod/, '').toLowerCase();
      }
      
      // Get description if available
      if (fieldSchema.description) { // Zod 스키마의 .description을 직접 사용
        property.description = fieldSchema.description;
      }
      
      if (isOptional) {
        property.optional = true;
      } else if (!required.includes(key)) { // Add to required if not optional and not already present
        required.push(key);
      }
      properties[key] = property;
    }
  }

  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined, // Set required only if it has elements
  };
}

// MCP Discover Endpoint
app.get('/mcp/discover', (req: Request, res: Response) => {
  try {
    const tools = [
      {
        name: 'PngToWebpTool',
        description: (PngToWebpTool as any).description ?? 'Converts a base64 encoded PNG image to WebP format.',
        inputSchema: zodSchemaToDiscoveryJson(pngToWebpTool.schema),
      },
      {
        name: 'PngFileToWebpTool',
        description: (PngFileToWebpTool as any).description ?? 'Converts an uploaded PNG file (multipart/form-data) to WebP format.',
        // For PngFileToWebpTool, the 'imageFile' part is handled by multer and not part of the Zod schema for other params.
        // We manually define its schema part here and merge with Zod-derived params.
        inputSchema: {
          type: 'object',
          properties: {
            imageFile: { type: 'string', format: 'binary', description: 'The PNG image file to convert.' },
            // Other parameters (quality, lossless, animated) will be merged from PngFileToWebpTool.schema
          },
          required: ['imageFile'], // imageFile is always required for this tool
        },
      },
    ];

    // Merge Zod schema properties for PngFileToWebpTool (quality, lossless, animated)
    const pngFileToolZodParamsSchema = zodSchemaToDiscoveryJson(pngFileToWebpTool.schema);
    if (tools[1]?.inputSchema?.properties && pngFileToolZodParamsSchema.properties) {
      tools[1].inputSchema.properties = {
        ...(tools[1].inputSchema.properties as Record<string, any>),
        ...(pngFileToolZodParamsSchema.properties as Record<string, any>),
      };
      // Merge 'required' arrays, ensuring 'imageFile' remains and adding others from Zod schema if not optional
      const zodRequired = pngFileToolZodParamsSchema.required ?? [];
      tools[1].inputSchema.required = Array.from(new Set([...(tools[1].inputSchema.required ?? []), ...zodRequired]));
    }


    res.json({
      tools,
      resources: [], 
      prompts: [],   
    });
  } catch (error) {
    console.error('Error in /mcp/discover:', error);
    if (error instanceof Error) {
        res.status(500).json({ error: 'Failed to discover tools.', message: error.message, stack: error.stack });
    } else {
        res.status(500).json({ error: 'Failed to discover tools.', message: String(error) });
    }
  }
});

// MCP Execute Endpoint
app.post('/mcp/execute', upload.single('imageFile'), async (req: Request, res: Response) => {
  const { toolName, input: rawInput } = req.body;

  // PngFileToWebpTool의 경우, input이 JSON 문자열로 올 수 있으므로 파싱 시도
  let input = rawInput;
  if (toolName === 'PngFileToWebpTool' && typeof rawInput === 'string') {
    try {
      input = JSON.parse(rawInput);
    } catch (e) {
      res.status(400).json({ success: false, error: 'Invalid JSON input for PngFileToWebpTool' });
      return; // Explicitly return to avoid further execution in this case
    }
  }

  try {
    let result;
    switch (toolName) {
      case 'PngToWebpTool': {
        const validatedPngToWebpInput: PngToWebpInput = pngToWebpTool.schema.parse(input);
        result = await pngToWebpTool.execute(validatedPngToWebpInput);
        break;
      }
      case 'PngFileToWebpTool': {
        if (!req.file) {
          res.status(400).json({ success: false, error: "'imageFile' is required for PngFileToWebpTool." });
          return;
        }
        // req.body에는 quality, lossless, animated 등이 포함될 수 있음
        const validatedPngFileToWebpInput: PngFileToWebpInput = pngFileToWebpTool.schema.parse(input ?? {}); // input이 없을 경우 빈 객체로 파싱 시도
        result = await pngFileToWebpTool.execute(validatedPngFileToWebpInput, { customContext: req });
        break;
      }
      default: {
        res.status(400).json({ success: false, error: `Unknown tool: ${toolName}` });
        return;
      }
    }
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Invalid input', details: error.errors });
    } else if (error instanceof Error) {
      console.error(`Error in /mcp/execute (${toolName}):`, error.message);
      res.status(500).json({ success: false, error: error.message });
    } else {
      console.error(`Unknown error in /mcp/execute (${toolName}):`, error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

// Function to create a server starter with port conflict resolution
function createStartServer(appInstance: express.Express) {
  const MAX_ATTEMPTS = 100; // Max attempts to find a port

  return function startServerInstance(initialPortToTry: number) {
    let currentPortToTry = initialPortToTry;
    let attempts = 0;

    const attemptListen = () => {
      if (attempts >= MAX_ATTEMPTS) {
        console.error(`Failed to start server after ${MAX_ATTEMPTS} attempts. Last port tried: ${currentPortToTry -1}.`);
        process.exit(1); // Exit if no port is found
        return;
      }

      appInstance.listen(currentPortToTry, () => {
        console.log(`Image Converter server running on http://localhost:${currentPortToTry}`);
      }).on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          attempts++;
          currentPortToTry++;
          attemptListen();
        } else {
          console.error(`Failed to start server on port ${currentPortToTry}:`, err);
          process.exit(1); // Exit on other errors
        }
      });
    };
    attemptListen();
  };
}

const serverStarter = createStartServer(app);
serverStarter(port); // 'port' is from the top of the file
