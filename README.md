# 이미지 변환 MCP (Model Context Protocol)

PNG 이미지를 WebP 형식으로 변환하는 MCP(Model Context Protocol) 서버입니다. Windsurf에서 사용할 수 있도록 설계되었습니다.

## 기능

- PNG 이미지를 WebP 형식으로 변환
- 이미지 품질 조정 지원 (1-100)
- Windsurf MCP 표준 준수

## 설치 방법

### 로컬 개발용 설치

```bash
# 저장소 복제
git clone https://github.com/windsurf/image-converter-mcp.git
cd image-converter-mcp

# 의존성 설치
npm install
```

### npm에서 설치

```bash
npm install -g image-converter-mcp
```

## 실행 방법

### 로컬 개발 시

```bash
# 서버 시작
npm start

# 개발 모드로 실행 (자동 재시작)
npm run dev
```

### 전역 설치 시

```bash
image-converter-mcp
```

서버는 기본적으로 3000번 포트에서 실행됩니다.

## API 엔드포인트

### 일반 REST API

#### 1. PNG를 WebP로 변환

**엔드포인트:** `POST /api/convert/png-to-webp`

**요청 형식:** `multipart/form-data`

**매개변수:**
- `image`: PNG 이미지 파일 (필수)

**응답 형식:** `application/json`

**응답 예시:**
```json
{
  "success": true,
  "message": "PNG를 WebP로 변환했습니다.",
  "outputUrl": "http://localhost:3000/output/1621234567890.webp",
  "fileName": "1621234567890.webp"
}
```

#### 2. MCP 정보 조회

**엔드포인트:** `GET /api/mcp-info`

**응답 형식:** `application/json`

**응답 예시:**
```json
{
  "name": "image-converter",
  "version": "1.0.0",
  "description": "이미지 변환 MCP",
  "endpoints": [
    {
      "path": "/api/convert/png-to-webp",
      "method": "POST",
      "description": "PNG 이미지를 WebP 형식으로 변환",
      "parameters": [
        {
          "name": "image",
          "type": "file",
          "required": true,
          "description": "변환할 PNG 이미지 파일"
        }
      ]
    }
  ]
}
```

### Windsurf MCP API

#### 1. 사용 가능한 툴 목록 조회

**엔드포인트:** `GET /mcp/list-tools`

**응답 형식:** `application/json`

**응답 예시:**
```json
{
  "tools": [
    {
      "name": "convert_png_to_webp",
      "description": "PNG 이미지를 WebP 형식으로 변환합니다",
      "parameters": {
        "type": "object",
        "properties": {
          "image_url": {
            "type": "string",
            "description": "변환할 PNG 이미지 URL"
          },
          "quality": {
            "type": "number",
            "description": "WebP 이미지 품질 (1-100)",
            "default": 80
          }
        },
        "required": ["image_url"]
      }
    }
  ]
}
```

#### 2. 툴 실행

**엔드포인트:** `POST /mcp/run-tool`

**요청 형식:** `application/json`

**요청 예시:**
```json
{
  "tool": "convert_png_to_webp",
  "parameters": {
    "image_url": "https://example.com/image.png",
    "quality": 90
  }
}
```

**응답 형식:** `application/json`

**응답 예시:**
```json
{
  "success": true,
  "message": "PNG를 WebP로 변환했습니다.",
  "output_url": "http://localhost:3000/output/1621234567890.webp",
  "file_name": "1621234567890.webp"
}
```

## 사용 예시

### 일반 REST API 사용 예시

```javascript
// 클라이언트 측 예시 코드 (JavaScript)
const formData = new FormData();
formData.append('image', pngFile); // pngFile은 File 객체

fetch('http://localhost:3000/api/convert/png-to-webp', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('변환된 WebP 파일:', data.outputUrl);
})
.catch(error => {
  console.error('오류 발생:', error);
});
```

### Windsurf MCP 사용 예시

```javascript
// Windsurf MCP 사용 예시 (JavaScript)
fetch('http://localhost:3000/mcp/run-tool', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tool: 'convert_png_to_webp',
    parameters: {
      image_url: 'https://example.com/image.png',
      quality: 90
    }
  })
})
.then(response => response.json())
.then(data => {
  console.log('변환된 WebP 파일:', data.output_url);
})
.catch(error => {
  console.error('오류 발생:', error);
});
```

### Windsurf 내부에서 사용 예시

```python
# Windsurf에서 사용하는 경우
result = convert_png_to_webp(
    image_url="https://example.com/image.png",
    quality=90
)
print(f"변환된 WebP 파일: {result['output_url']}")
```

## Windsurf 통합 방법

### 1. 패키지 설치

패키지를 npm에 배포한 후 사용하는 방법입니다.

### 2. Windsurf 설정 파일 수정

Windsurf의 `mcp_config.json` 파일에 다음 설정을 추가합니다:

```json
"image-converter": {
  "command": "npx",
  "args": [
    "-y",
    "image-converter-mcp"
  ],
  "env": {}
}
```

### 3. Windsurf 재시작

Windsurf를 재시작하여 MCP 서버가 로드되도록 합니다.

### 4. 툴 사용

Windsurf에서 다음과 같이 사용할 수 있습니다:

```python
# Windsurf에서 사용하는 경우
result = convert_png_to_webp(
    image_url="https://example.com/image.png",
    quality=90
)
```

## 배포 방법

### npm에 패키지 배포

1. npm 계정이 없다면 가입하고 로그인합니다:
   ```bash
   npm login
   ```

2. 패키지 배포:
   ```bash
   npm publish
   ```

### 로컬에서 테스트

배포 전에 로컬에서 테스트하는 방법:

```bash
# 패키지 만들기
npm pack

# 로컬에서 설치
npm install -g ./image-converter-mcp-1.0.0.tgz

# 실행
image-converter-mcp
```

## 구현 상세

### 사용된 기술

- **Node.js**: 서버 플랫폼
- **Express**: 웹 서버 프레임워크
- **Sharp**: 이미지 처리 라이브러리
- **Multer**: 파일 업로드 처리

### 파일 구조

```
.
├── bin/
│   └── cli.js         # CLI 실행 파일
├── index.js         # 서버 메인 파일
├── image-converter.js # 이미지 변환 로직
├── package.json     # 패키지 설정
├── README.md        # 사용 설명서
├── uploads/         # 임시 업로드 폴더
└── output/          # 변환된 이미지 저장 폴더
```

## 라이센스

MIT
