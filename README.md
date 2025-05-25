# Image Converter MCP

이미지 변환을 위한 Model Context Protocol (MCP) 서버입니다. 현재는 PNG에서 WebP 형식으로의 변환을 지원합니다.

## 기능

- PNG 이미지를 WebP 형식으로 고품질 변환
- 무손실 압축 지원
- 애니메이션 PNG(APNG) 지원
- 다양한 품질 설정 옵션 제공

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 프로젝트 빌드
npm run build

# 개발 모드로 실행 (자동 재시작)
npm run dev

# 프로덕션 빌드 및 실행
npm run build
npm start
```

## API 사용법

### PNG to WebP 변환

**엔드포인트**: `/api/tools/pngToWebp`

**요청 본문 (JSON)**:

```json
{
  "imageData": "data:image/png;base64,...",
  "quality": 85,
  "lossless": true,
  "animated": false
}
```

**파라미터 설명**:

- `imageData` (필수): Base64로 인코딩된 PNG 이미지 데이터 (data:image/png;base64,... 형식)
- `quality` (선택, 기본값: 80): WebP 이미지 품질 (1-100, 높을수록 품질이 좋음)
- `lossless` (선택, 기본값: true): 무손실 압축 사용 여부
- `animated` (선택, 기본값: false): 애니메이션 지원 여부

**응답 예시 (성공)**:

```json
{
  "success": true,
  "dataUrl": "data:image/webp;base64,...",
  "metadata": {
    "format": "webp",
    "width": 800,
    "height": 600,
    "size": 45210,
    "originalFormat": "png",
    "originalSize": 102400
  }
}
```

**응답 예시 (실패)**:

```json
{
  "success": false,
  "error": "유효하지 않은 이미지 데이터입니다."
}
```

## 프로젝트 구조

```
image-converter/
├── src/
│   ├── tools/              # MCP 도구들
│   │   └── PngtowebpTool.ts # PNG to WebP 변환 도구
│   └── index.ts            # 서버 진입점
├── package.json
└── tsconfig.json
```

## 개발 가이드

### 새로운 도구 추가하기

새로운 이미지 변환 도구를 추가하려면 다음 명령어를 사용하세요:

```bash
mcp add tool [도구이름]
```

### 테스트

```bash
# 테스트 실행
npm test

# 테스트 커버리지 확인
npm run test:coverage
```

## 라이선스

MIT
# Example tools you might create:
mcp add tool data-processor
mcp add tool api-client
mcp add tool file-handler
```

## Tool Development

Example tool structure:

```typescript
import { MCPTool } from "mcp-framework";
import { z } from "zod";

interface MyToolInput {
  message: string;
}

class MyTool extends MCPTool<MyToolInput> {
  name = "my_tool";
  description = "Describes what your tool does";

  schema = {
    message: {
      type: z.string(),
      description: "Description of this input parameter",
    },
  };

  async execute(input: MyToolInput) {
    // Your tool logic here
    return `Processed: ${input.message}`;
  }
}

export default MyTool;
```

## Publishing to npm

1. Update your package.json:
   - Ensure `name` is unique and follows npm naming conventions
   - Set appropriate `version`
   - Add `description`, `author`, `license`, etc.
   - Check `bin` points to the correct entry file

2. Build and test locally:
   ```bash
   npm run build
   npm link
   image-converter  # Test your CLI locally
   ```

3. Login to npm (create account if necessary):
   ```bash
   npm login
   ```

4. Publish your package:
   ```bash
   npm publish
   ```

After publishing, users can add it to their claude desktop client (read below) or run it with npx
```

## Using with Claude Desktop

### Local Development

Add this configuration to your Claude Desktop config file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "image-converter": {
      "command": "node",
      "args":["/absolute/path/to/image-converter/dist/index.js"]
    }
  }
}
```

### After Publishing

Add this configuration to your Claude Desktop config file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "image-converter": {
      "command": "npx",
      "args": ["image-converter"]
    }
  }
}
```

## Building and Testing

1. Make changes to your tools
2. Run `npm run build` to compile
3. The server will automatically load your tools on startup

## Learn More

- [MCP Framework Github](https://github.com/QuantGeekDev/mcp-framework)
- [MCP Framework Docs](https://mcp-framework.com)
