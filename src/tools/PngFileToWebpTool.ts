import { z } from "zod";
import sharp from "sharp";
import { Request } from 'express'; // Request 타입 임포트

// 입력 파라미터 스키마 정의 (PngToWebpTool.ts 방식 참고)
// 입력 파라미터 스키마 정의 (파일 자체는 multer로 처리)
const PngFileToWebpParamsSchema = z.object({
  quality: z.number().min(1).max(100).optional().default(80).describe("WebP 이미지 품질 (1-100, 기본값: 80)"),
  lossless: z.boolean().optional().default(true).describe("무손실 압축 사용 여부 (기본값: true)"),
  animated: z.boolean().optional().default(false).describe("애니메이션 지원 여부 (기본값: false)"),
});

export type PngFileToWebpInput = z.infer<typeof PngFileToWebpParamsSchema>;

// 반환 타입 정의
interface PngFileToWebpOutput {
  success: boolean;
  webpBase64?: string;
  error?: string;
  metadata?: object;
}

// MCPTool을 상속하지 않는 일반 클래스로 변경
class PngFileToWebpTool {
  name = 'png_file_to_webp';
  description = '업로드된 PNG 파일을 WebP 형식으로 변환하여 Base64로 반환합니다.';
  
  get schema() {
    return PngFileToWebpParamsSchema;
  }

  async execute(input: PngFileToWebpInput, context?: any): Promise<PngFileToWebpOutput> {
    const req = context?.customContext as Request | undefined;

    if (!req?.file) {
      return {
        success: false,
        error: "이미지 파일이 업로드되지 않았습니다. 'imageFile' 필드로 파일을 전송해야 합니다.",
      };
    }

    const imageBuffer = req.file.buffer;

    // 입력값에 대한 기본값 처리
    const quality = input.quality ?? 80;
    const lossless = input.lossless ?? true;
    const animated = input.animated ?? false;

    try {
      const webpOptions: sharp.WebpOptions = {
        quality: quality,
        lossless: lossless,
      };

      const image = sharp(imageBuffer, { animated: animated });
      const metadata = await image.metadata();
      const webpBuffer = await image.webp(webpOptions).toBuffer();
      const webpBase64 = webpBuffer.toString('base64');

      return {
        success: true,
        webpBase64: `data:image/webp;base64,${webpBase64}`,
        metadata: metadata,
      };
    } catch (error: any) {
      console.error('Error converting uploaded PNG to WebP:', error);
      return {
        success: false,
        error: error.message ?? 'Unknown error during conversion',
      };
    }
  }
}

export default PngFileToWebpTool;
