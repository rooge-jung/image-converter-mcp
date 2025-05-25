#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

// 서버 시작 함수
function startServer() {
  console.log('이미지 변환 MCP 서버를 시작합니다...');
  
  // 서버 실행 (index.js)
  const serverProcess = spawn('node', [path.join(__dirname, '../index.js')], {
    stdio: 'inherit',
    env: {
      ...process.env
    }
  });

  // 프로세스 종료 이벤트 처리
  serverProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`서버가 코드 ${code}로 종료되었습니다.`);
      process.exit(code);
    }
    console.log('서버가 종료되었습니다.');
  });

  // SIGINT, SIGTERM 시그널 처리
  process.on('SIGINT', () => {
    console.log('서버를 종료합니다...');
    serverProcess.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('서버를 종료합니다...');
    serverProcess.kill('SIGTERM');
  });
}

// 서버 시작
startServer();
