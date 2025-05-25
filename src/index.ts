#!/usr/bin/env node
import express, { Request, Response } from 'express';
import multer from 'multer';
import PngToWebpTool, { PngToWebpInput } from './tools/PngToWebpTool.js'; // PngToWebpInput 임포트
import PngFileToWebpTool, { PngFileToWebpInput } from './tools/PngFileToWebpTool.js'; // PngFileToWebpInput 임포트
import { z, ZodTypeAny } from 'zod';

const app = express();
const port = parseInt(process.env.PORT ?? '3001', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const pngToWebpTool = new PngToWebpTool();
const pngFileToWebpTool = new PngFileToWebpTool();

// Helper function to create a Zod object schema from tool's schema definition
function createZodSchemaFromTool<
  InputSchemaProps extends Record<string, { type: ZodTypeAny }>
>(toolSchemaProps: InputSchemaProps): z.ZodObject<{ [K in keyof InputSchemaProps]: InputSchemaProps[K]['type'] }> {
  const shape = {} as { [K in keyof InputSchemaProps]: InputSchemaProps[K]['type'] };
  for (const key in toolSchemaProps) {
    if (Object.hasOwn(toolSchemaProps, key)) { // Object.hasOwn() 사용
      shape[key] = toolSchemaProps[key].type;
    }
  }
  return z.object(shape);
}

app.post('/api/png_to_webp', async (req: Request, res: Response) => {
  try {
    const zodSchema = createZodSchemaFromTool(pngToWebpTool.schema);
    // validatedInput에 명시적 타입 PngToWebpInput 지정
    const validatedInput: PngToWebpInput = zodSchema.parse(req.body);
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
    const zodSchema = createZodSchemaFromTool(pngFileToWebpTool.schema);
    // validatedInput에 명시적 타입 PngFileToWebpInput 지정
    const validatedInput: PngFileToWebpInput = zodSchema.parse(req.body);
    
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

app.listen(port, () => {
  console.log(`Image Converter server running on http://localhost:${port}`);
});
