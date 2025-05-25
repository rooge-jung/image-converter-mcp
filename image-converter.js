const sharp = require('sharp');
const fs = require('fs');

/**
 * PNG 이미지를 WebP 형식으로 변환
 * @param {string} inputPath - 입력 PNG 파일 경로
 * @param {string} outputPath - 출력 WebP 파일 경로
 * @param {Object} options - 변환 옵션
 * @param {number} options.quality - WebP 품질 (0-100, 기본값: 80)
 * @returns {Promise<void>}
 */
async function pngToWebp(inputPath, outputPath, options = { quality: 80 }) {
  try {
    // 입력 파일이 존재하는지 확인
    if (!fs.existsSync(inputPath)) {
      throw new Error(`입력 파일이 존재하지 않습니다: ${inputPath}`);
    }

    // Sharp를 사용하여 PNG를 WebP로 변환
    await sharp(inputPath)
      .webp(options)
      .toFile(outputPath);
    
    console.log(`변환 완료: ${inputPath} -> ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('이미지 변환 중 오류 발생:', error);
    throw error;
  }
}

module.exports = {
  pngToWebp
};
