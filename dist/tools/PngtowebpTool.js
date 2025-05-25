import { MCPTool } from "mcp-framework";
import { z } from "zod";
import sharp from "sharp";
class PngToWebpTool extends MCPTool {
    name = "pngToWebp";
    description = "PNG 이미지를 WebP 형식으로 변환합니다.";
    schema = {
        imageData: {
            type: z.string(),
            description: "Base64로 인코딩된 PNG 이미지 데이터 (data:image/png;base64,... 형식)",
        },
        quality: {
            type: z.number().min(1).max(100).optional().default(80),
            description: "WebP 이미지 품질 (1-100, 높을수록 품질이 좋음)",
        },
        lossless: {
            type: z.boolean().optional().default(true),
            description: "무손실 압축 사용 여부 (기본값: true)",
        },
        animated: {
            type: z.boolean().optional().default(false),
            description: "애니메이션 지원 여부 (기본값: false)",
        },
    }; // as const를 추가하여 타입 안정성 확보
    async execute(input) {
        try {
            // Base64에서 Buffer로 변환 (data:image/png;base64, 접두사 제거)
            const base64Data = input.imageData.replace(/^data:image\/png;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            // WebP 변환 옵션 설정
            const webpOptions = {
                quality: input.quality ?? 80,
                lossless: input.lossless ?? true,
                effort: 6, // 압축 속도/품질 균형 (0-6, 높을수록 품질은 좋지만 느림)
                alphaQuality: input.lossless ? 100 : 80, // 투명도 품질
            };
            // 이미지 처리
            let image = sharp(buffer, { animated: input.animated });
            // 메타데이터 추출 (선택사항)
            const metadata = await image.metadata();
            // WebP로 변환
            const webpBuffer = await image
                .webp(webpOptions)
                .toBuffer();
            // Base64로 인코딩하여 반환
            const base64WebP = webpBuffer.toString('base64');
            const dataUrl = `data:image/webp;base64,${base64WebP}`;
            return {
                success: true,
                dataUrl,
                metadata: {
                    format: 'webp',
                    width: metadata.width,
                    height: metadata.height,
                    size: webpBuffer.length,
                    originalFormat: metadata.format,
                    originalSize: buffer.length,
                },
            };
        }
        catch (error) {
            console.error('PNG to WebP 변환 중 오류 발생:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
            };
        }
    }
}
export default PngToWebpTool;
