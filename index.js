const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const imageConverter = require('./image-converter');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

// 임시 파일 저장을 위한 디렉토리 생성
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function(req, file, cb) {
    // PNG 파일만 허용
    if (file.mimetype !== 'image/png') {
      return cb(new Error('PNG 파일만 업로드 가능합니다.'), false);
    }
    cb(null, true);
  }
});

// CORS 설정
app.use(cors({
  origin: '*', // Windsurf에서 접근할 수 있도록 모든 도메인 허용
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use('/output', express.static(outputDir));

// MCP 엔드포인트
app.post('/api/convert/png-to-webp', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
    }

    const inputPath = req.file.path;
    const outputFileName = path.basename(req.file.filename, path.extname(req.file.filename)) + '.webp';
    const outputPath = path.join(outputDir, outputFileName);

    // PNG를 WebP로 변환
    await imageConverter.pngToWebp(inputPath, outputPath);

    // 원본 파일 삭제
    fs.unlinkSync(inputPath);

    // 결과 URL 생성
    const resultUrl = `${BASE_URL}/output/${outputFileName}`;

    res.json({
      success: true,
      message: 'PNG를 WebP로 변환했습니다.',
      outputUrl: resultUrl,
      fileName: outputFileName
    });
  } catch (error) {
    console.error('변환 오류:', error);
    res.status(500).json({ error: '이미지 변환 중 오류가 발생했습니다.' });
  }
});

// MCP 메타데이터 엔드포인트
app.get('/api/mcp-info', (req, res) => {
  res.json({
    name: 'image-converter',
    version: '1.0.0',
    description: '이미지 변환 MCP',
    endpoints: [
      {
        path: '/api/convert/png-to-webp',
        method: 'POST',
        description: 'PNG 이미지를 WebP 형식으로 변환',
        parameters: [
          {
            name: 'image',
            type: 'file',
            required: true,
            description: '변환할 PNG 이미지 파일'
          }
        ]
      }
    ]
  });
});

// Windsurf MCP 표준 엔드포인트
app.get('/mcp/list-tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'convert_png_to_webp',
        description: 'PNG 이미지를 WebP 형식으로 변환합니다',
        parameters: {
          type: 'object',
          properties: {
            image_url: {
              type: 'string',
              description: '변환할 PNG 이미지 URL'
            },
            quality: {
              type: 'number',
              description: 'WebP 이미지 품질 (1-100)',
              default: 80
            }
          },
          required: ['image_url']
        }
      }
    ]
  });
});

// Windsurf MCP 표준 툴 엔드포인트
app.post('/mcp/run-tool', express.json(), async (req, res) => {
  try {
    const { tool, parameters } = req.body;
    
    if (tool === 'convert_png_to_webp') {
      const { image_url, quality = 80 } = parameters;
      
      if (!image_url) {
        return res.status(400).json({ error: '이미지 URL이 필요합니다.' });
      }
      
      // 원격 이미지 다운로드
      const response = await fetch(image_url);
      if (!response.ok) {
        return res.status(400).json({ error: '이미지 다운로드에 실패했습니다.' });
      }
      
      const fileName = `${Date.now()}.png`;
      const inputPath = path.join(uploadsDir, fileName);
      const outputFileName = `${Date.now()}.webp`;
      const outputPath = path.join(outputDir, outputFileName);
      
      // 이미지 저장
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(inputPath, Buffer.from(buffer));
      
      // PNG를 WebP로 변환
      await imageConverter.pngToWebp(inputPath, outputPath, { quality });
      
      // 원본 파일 삭제
      fs.unlinkSync(inputPath);
      
      // 결과 URL 생성
      const resultUrl = `${BASE_URL}/output/${outputFileName}`;
      
      res.json({
        success: true,
        message: 'PNG를 WebP로 변환했습니다.',
        output_url: resultUrl,
        file_name: outputFileName
      });
    } else {
      res.status(400).json({ error: '지원하지 않는 툴입니다.' });
    }
  } catch (error) {
    console.error('툴 실행 오류:', error);
    res.status(500).json({ error: '툴 실행 중 오류가 발생했습니다.' });
  }
});

app.listen(PORT, () => {
  console.log(`이미지 변환 MCP 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`기본 URL: ${BASE_URL}`);
});
