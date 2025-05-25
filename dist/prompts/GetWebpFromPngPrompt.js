import { MCPPrompt } from "mcp-framework";
import { z } from "zod";
class GetWebpFromPngPrompt extends MCPPrompt {
    name = "get_webp_from_png";
    description = "PNG 이미지를 WebP 형식으로 변환하는 프롬프트입니다. 이미지 데이터와 변환 옵션을 제공하세요.";
    schema = {
        pngImageData: {
            type: z.string(),
            description: "Base64로 인코딩된 PNG 이미지 데이터 (data:image/png;base64,... 형식)",
            required: true,
        },
        quality: {
            type: z.number().min(1).max(100).optional().default(80),
            description: "WebP 이미지 품질 (1-100, 높을수록 품질이 좋음, 기본값: 80)",
        },
        lossless: {
            type: z.boolean().optional().default(true),
            description: "무손실 압축 사용 여부 (기본값: true)",
        },
        animated: {
            type: z.boolean().optional().default(false),
            description: "애니메이션 지원 여부 (기본값: false)",
        },
        download: {
            type: z.boolean().optional().default(false),
            description: "변환된 이미지를 다운로드할지 여부 (기본값: false)",
        },
    };
    async generateMessages({ pngImageData, quality = 80, lossless = true, animated = false, download = false, }) {
        return [
            {
                role: "system",
                content: {
                    type: "text",
                    text: `
          당신은 PNG 이미지를 WebP 형식으로 변환하는 도우미입니다.
          사용자가 제공한 PNG 이미지 데이터를 WebP 형식으로 변환합니다.
          
          변환 옵션:
          - 품질: ${quality} (1-100)
          - 무손실 압축: ${lossless ? "사용" : "사용 안 함"}
          - 애니메이션: ${animated ? "지원" : "지원 안 함"}
          - 다운로드: ${download ? "예" : "아니오"}
          
          변환이 완료되면 결과를 사용자에게 알려주세요.`,
                },
            },
            {
                role: "user",
                content: {
                    type: "text",
                    text: `PNG 이미지를 WebP로 변환해주세요.`,
                },
            },
            {
                role: "assistant",
                content: {
                    type: "tool-call",
                    text: "PNG 이미지를 WebP로 변환 중입니다...",
                    toolName: "png_to_webp",
                    args: {
                        imageData: pngImageData,
                        quality,
                        lossless,
                        animated,
                    },
                },
            },
        ];
    }
}
export default GetWebpFromPngPrompt;
