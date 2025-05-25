#!/usr/bin/env node

/**
 * 네이티브 모듈 의존성 설치 스크립트
 * 
 * 이 스크립트는 package.json의 postinstall에서 실행되며,
 * 플랫폼별 네이티브 모듈 의존성 문제를 해결합니다.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 네이티브 모듈 목록 (필요시 추가)
const nativeModules = [
  'sharp'
  // 추가 네이티브 모듈을 여기에 나열
];

// package.json 읽기
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 현재 플랫폼 및 아키텍처 정보
const platform = process.platform;
const arch = process.arch;

console.log(`현재 플랫폼: ${platform}, 아키텍처: ${arch}`);

// 네이티브 모듈 설치 함수
function installNativeModule(moduleName) {
  try {
    // 모듈 로드 시도
    require(moduleName);
    console.log(`${moduleName} 모듈이 이미 정상적으로 설치되어 있습니다.`);
  } catch (e) {
    // 모듈을 찾을 수 없는 경우에만 설치 진행
    if (e.code === 'MODULE_NOT_FOUND') {
      // 모듈 로드 실패 시 플랫폼별 설치 진행
      console.log(`${moduleName} 모듈을 현재 플랫폼(${platform}-${arch})에 맞게 설치합니다...`);
      
      try {
        execSync(`npm install --platform=${platform} --arch=${arch} ${moduleName}`, {
          stdio: 'inherit'
        });
        console.log(`${moduleName} 모듈 설치 완료!`);
      } catch (installError) {
        console.error(`${moduleName} 모듈 설치 중 오류 발생:`, installError.message);
      }
    } else {
      // 다른 종류의 오류인 경우
      console.error(`${moduleName} 모듈 로드 중 예상치 못한 오류 발생:`, e.message);
    }
  }
}

// 모든 네이티브 모듈 확인 및 설치
console.log('네이티브 모듈 의존성을 확인합니다...');
nativeModules.forEach(installNativeModule);
console.log('네이티브 모듈 의존성 확인 완료!');
