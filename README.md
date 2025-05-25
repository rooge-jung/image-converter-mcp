# 이미지 변환 MCP (Model Context Protocol)

PNG 이미지를 WebP 형식으로 변환하는 MCP 서버입니다. Railway에 배포하여 Windsurf에서 사용할 수 있습니다.

## 기능

- PNG → WebP 변환

## 설치 방법

```bash
# 의존성 설치
npm install
```

## 실행 방법

```bash
# 서버 시작
npm start
```

서버는 기본적으로 3000번 포트에서 실행됩니다.

## API 엔드포인트

### 일반 API 엔드포인트

#### PNG를 WebP로 변환

**엔드포인트:** `POST /api/convert/png-to-webp`

**요청 형식:** `multipart/form-data`

**매개변수:**
- `image`: PNG 이미지 파일 (필수)

**응답 예시:**
```json
{
  "success": true,
  "message": "PNG를 WebP로 변환했습니다.",
  "outputUrl": "https://your-app.railway.app/output/1621234567890.webp",
  "fileName": "1621234567890.webp"
}
```

#### MCP 정보 조회

**엔드포인트:** `GET /api/mcp-info`

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

### Windsurf MCP 엔드포인트

#### 사용 가능한 툴 목록 조회

**엔드포인트:** `GET /mcp/list-tools`

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

#### 툴 실행

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

**응답 예시:**
```json
{
  "success": true,
  "message": "PNG를 WebP로 변환했습니다.",
  "output_url": "https://your-app.railway.app/output/1621234567890.webp",
  "file_name": "1621234567890.webp"
}
```

## 사용 예시

### 일반 API 사용 예시

```javascript
// 클라이언트 측 예시 코드 (JavaScript)
const formData = new FormData();
formData.append('image', pngFile); // pngFile은 File 객체

fetch('https://your-app.railway.app/api/convert/png-to-webp', {
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
// Windsurf MCP 사용 예시
fetch('https://your-app.railway.app/mcp/run-tool', {
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

## Railway 배포 방법

1. [Railway](https://railway.app/) 계정 생성 및 로그인

2. 새 프로젝트 생성
   - GitHub 저장소에서 배포하거나 직접 코드 업로드

3. 환경 변수 설정 (필요한 경우)
   - `PORT`: 서버 포트 (기본값: 3000)
   - `NODE_ENV`: 환경 설정 (production, development 등)

4. 배포 완료 후 제공되는 URL을 Windsurf MCP 서버 목록에 추가

## Windsurf 연동 방법

1. Windsurf 관리자 페이지에서 MCP 서버 추가
   - 서버 이름: `image-converter`
   - 서버 URL: `https://your-app.railway.app`

2. Windsurf에서 다음과 같이 사용:
   ```
   convert_png_to_webp(image_url="https://example.com/image.png", quality=90)
   ```
