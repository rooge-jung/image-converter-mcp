// src/prompts/GetWebpFromBase64PngPrompt.ts
import { z } from 'zod';

// Schema similar to PngToWebpTool's input
export const GetWebpFromBase64PngPromptSchema = z.object({
  imageData: z.string().describe("Base64로 인코딩된 PNG 이미지 데이터 (data:image/png;base64,... 형식)"),
  quality: z.number().min(1).max(100).optional().default(80).describe("Quality of the WebP image (1-100)"),
  lossless: z.boolean().optional().default(false).describe("Use lossless compression"),
});

export type GetWebpFromBase64PngPromptInput = z.infer<typeof GetWebpFromBase64PngPromptSchema>;

export class GetWebpFromBase64PngPrompt {
  name = "get_webp_from_base64_png";
  description = "Takes base64 encoded PNG image data and returns a WebP image. (This is a placeholder prompt)";

  get schema() {
    return GetWebpFromBase64PngPromptSchema;
  }

  // Placeholder execute method if needed in the future
  // async execute(input: GetWebpFromBase64PngPromptInput) {
  //   console.log("Executing GetWebpFromBase64PngPrompt with input:", input);
  //   return {
  //     message: "Prompt executed (placeholder)",
  //     webpImageData: "data:image/webp;base64,..." // Placeholder
  //   };
  // }
}
