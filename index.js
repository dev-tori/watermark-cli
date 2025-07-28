/*
 * Watermark CLI
 *
 * 이 스크립트는 JPG 또는 PNG 이미지에 텍스트 혹은 이미지 워터마크를 추가하는 기능을 제공합니다.
 * 모든 입력은 순차적인 프롬프트로 받아들이며, 사용자에게 다양한 옵션을 제공합니다.
 *
 * 기능:
 *  - 단일 파일 또는 여러 파일 처리 (콤마로 구분된 입력 또는 디렉토리 지정)
 *  - 텍스트 워터마크: 글꼴, 크기, 색상, 굵기, 기울임, 투명도 등 커스터마이즈 가능
 *  - 이미지 워터마크: 지정한 이미지 파일을 불러와 리사이즈 및 투명도 조절 후 적용
 *  - 워터마크 크기는 원본 이미지 크기에 비례하여 scale 비율로 조정
 *  - 워터마크 위치는 top-left, top-right, bottom-left, bottom-right, center 중 선택
 *  - 결과 이미지의 형식(JPG, PNG) 및 출력 디렉터리 선택
 *  - 같은 이름의 파일 존재 시 덮어쓰기 여부 선택
 *  - 처리 중 오류 발생 시 error.log 파일에 파일명과 에러 메시지 기록
 *
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
let sharp;

try {
  // sharp 모듈은 루트의 node_modules에 존재합니다. 필요시 require가 실패하면 메세지를 출력합니다.
  sharp = require('sharp');
} catch (err) {
  console.error('sharp 모듈을 찾을 수 없습니다. 프로젝트 상위 디렉터리에 sharp가 설치되어 있어야 합니다.');
  process.exit(1);
}

/**
 * readline 인터페이스 생성
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 사용자 입력을 프롬프트로부터 받아 Promise로 반환하는 유틸리티.
 * @param {string} query 프롬프트로 출력할 문자열
 * @returns {Promise<string>} 사용자가 입력한 문자열
 */
function ask(query) {
  return new Promise(resolve => {
    rl.question(query, answer => resolve(answer.trim()));
  });
}

/**
 * 문자열에서 XML 특수 문자를 이스케이프합니다.
 * SVG 내에 텍스트를 삽입할 때 필요합니다.
 * @param {string} str
 * @returns {string}
 */
function escapeXML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 디렉터리인지 여부를 확인합니다.
 * @param {string} p
 * @returns {boolean}
 */
function isDirectory(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch (err) {
    return false;
  }
}

/**
 * 확장자 검사: 이미지인지 확인 (jpg, jpeg, png)
 * @param {string} file
 * @returns {boolean}
 */
function isSupportedImage(file) {
  const ext = path.extname(file).toLowerCase();
  return ['.jpg', '.jpeg', '.png'].includes(ext);
}

/**
 * 디렉토리 내의 지원되는 이미지 파일 목록을 반환합니다.
 * @param {string} dirPath
 * @returns {string[]}
 */
function listImageFiles(dirPath) {
  let images = [];
  try {
    const files = fs.readdirSync(dirPath);
    for (const f of files) {
      const fullPath = path.join(dirPath, f);
      if (fs.statSync(fullPath).isFile() && isSupportedImage(fullPath)) {
        images.push(fullPath);
      }
    }
  } catch (err) {
    // ignore; listing error will be handled by higher level
  }
  return images;
}

/**
 * 출력 파일 이름을 생성합니다. 원본 파일명에 _watermarked 접미사를 붙입니다.
 * @param {string} inputFile 경로
 * @param {string} outputDir 출력 디렉터리
 * @param {string} format 확장자 (jpg 또는 png)
 * @returns {string}
 */
function generateOutputName(inputFile, outputDir, format) {
  const parsed = path.parse(inputFile);
  const newName = `${parsed.name}_watermarked.${format}`;
  return path.join(outputDir, newName);
}

/**
 * 텍스트 워터마크를 위한 SVG 버퍼를 생성합니다.
 * @param {object} opts 옵션 객체: text, fontFamily, fontSize, color, bold, italic, opacity
 * @returns {Buffer}
 */
function createTextWatermarkSVG(opts) {
  const { text, fontFamily, fontSize, color, bold, italic, opacity } = opts;
  const weight = bold ? 'bold' : 'normal';
  const style = italic ? 'italic' : 'normal';
  
  // 텍스트 길이에 따른 적절한 크기 계산
  const width = Math.max(500, text.length * fontSize * 0.8);
  const height = fontSize * 2;
  const centerX = width / 2;
  const centerY = height / 2 + fontSize / 3; // 텍스트 베이스라인 보정
  
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .text { 
        fill: ${color}; 
        fill-opacity: ${opacity}; 
        font-family: '${fontFamily}', sans-serif; 
        font-size: ${fontSize}px; 
        font-weight: ${weight}; 
        font-style: ${style}; 
        text-anchor: middle;
        dominant-baseline: middle;
      }
    </style>
    <text x="${centerX}" y="${centerY}" class="text">${escapeXML(text)}</text>
  </svg>`;
  return Buffer.from(svg);
}

/**
 * 주어진 이미지에 워터마크를 적용합니다.
 * @param {string} inputPath 원본 이미지 경로
 * @param {Buffer} watermarkBuf 워터마크 이미지 버퍼 (PNG)
 * @param {number} scale 0~1 사이의 비율 (이미지 너비 대비 워터마크 너비)
 * @param {string} position 위치 (center, top-left, top-right, bottom-left, bottom-right)
 * @param {number} opacity 0~1 사이의 투명도
 * @param {string} outputFormat 'jpg' 또는 'png'
 * @param {string} outputPath 출력 파일 경로
 * @param {boolean} isTextWatermark 텍스트 워터마크 여부
 */
async function applyWatermark(inputPath, watermarkBuf, scale, position, opacity, outputFormat, outputPath, isTextWatermark = false) {
  // 입력 이미지 로드 및 메타데이터 추출
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const baseWidth = metadata.width;
  const baseHeight = metadata.height;

  // 워터마크 이미지 읽기
  let watermark = sharp(watermarkBuf).ensureAlpha().png();
  
  // 워터마크 원본의 크기를 가져옵니다.
  const wmMeta = await watermark.metadata();
  
  // 목표 폭 계산: 원본 이미지 폭 * scale
  const targetW = Math.floor(baseWidth * scale);
  
  // 비율 유지하여 높이 계산
  const ratio = wmMeta.width ? targetW / wmMeta.width : 1;
  const targetH = wmMeta.height ? Math.floor(wmMeta.height * ratio) : Math.floor(targetW * 0.5);
  
  // 워터마크 리사이즈 및 투명도 적용
  let processedWatermark = watermark.resize({ width: targetW, height: targetH });
  
  // 이미지 워터마크의 경우 투명도를 여기서 적용
  if (!isTextWatermark && opacity < 1.0) {
    // 투명도를 적용하기 위해 composite를 사용
    const transparentOverlay = await sharp({
      create: {
        width: targetW,
        height: targetH,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: opacity }
      }
    }).png().toBuffer();
    
    processedWatermark = processedWatermark.composite([{
      input: transparentOverlay,
      blend: 'dest-in'
    }]);
  }
  
  const resizedWatermarkBuf = await processedWatermark.png().toBuffer();

  // 위치 계산
  let left = 0;
  let top = 0;
  switch (position) {
    case 'top-left':
      left = 0;
      top = 0;
      break;
    case 'top-right':
      left = baseWidth - targetW;
      top = 0;
      break;
    case 'bottom-left':
      left = 0;
      top = baseHeight - targetH;
      break;
    case 'bottom-right':
      left = baseWidth - targetW;
      top = baseHeight - targetH;
      break;
    case 'center':
    default:
      left = Math.floor((baseWidth - targetW) / 2);
      top = Math.floor((baseHeight - targetH) / 2);
      break;
  }

  // 베이스 이미지에 워터마크 합성
  let compositeOptions = {
    input: resizedWatermarkBuf,
    top: top,
    left: left,
    blend: 'over'
  };
  
  // 텍스트 워터마크의 경우에만 composite에서 opacity 사용 (SVG에서 이미 적용됨)
  // 이미지 워터마크는 위에서 이미 투명도를 적용했으므로 여기서는 사용하지 않음
  
  let outputSharp = image.composite([compositeOptions]);
  if (outputFormat === 'jpg' || outputFormat === 'jpeg') {
    outputSharp = outputSharp.jpeg({ quality: 95 });
  } else {
    outputSharp = outputSharp.png();
  }
  await outputSharp.toFile(outputPath);
}

/**
 * 메인 실행 함수
 */
async function main() {
  try {
    console.log('이미지 워터마크 CLI 프로그램에 오신 것을 환영합니다. 종료하려면 Ctrl+C를 누르세요.\n');

    // 1. 이미지 경로(파일/디렉터리) 입력
    let inputPathsStr = await ask('워터마크를 적용할 이미지 파일 또는 폴더 경로를 입력하세요 (여러 개는 콤마로 구분): ');
    while (!inputPathsStr) {
      inputPathsStr = await ask('경로를 입력해야 합니다. 다시 입력하세요: ');
    }
    const pathTokens = inputPathsStr.split(',').map(p => p.trim()).filter(Boolean);
    let filesToProcess = [];
    for (const token of pathTokens) {
      const resolved = path.resolve(token);
      if (!fs.existsSync(resolved)) {
        console.warn(`경로를 찾을 수 없습니다: ${token}`);
        continue;
      }
      if (isDirectory(resolved)) {
        const imgs = listImageFiles(resolved);
        filesToProcess.push(...imgs);
      } else if (isSupportedImage(resolved)) {
        filesToProcess.push(resolved);
      } else {
        console.warn(`지원하지 않는 파일 형식입니다: ${token}`);
      }
    }
    if (filesToProcess.length === 0) {
      console.error('처리할 이미지가 없습니다. 프로그램을 종료합니다.');
      rl.close();
      return;
    }
    // 중복 제거
    filesToProcess = Array.from(new Set(filesToProcess));

    // 2. 워터마크 종류 선택
    let wmType = await ask('워터마크 종류를 선택하세요 (text/image) [text]: ');
    wmType = wmType.toLowerCase() || 'text';
    while (!['text', 'image'].includes(wmType)) {
      wmType = (await ask('잘못된 입력입니다. text 혹은 image를 입력하세요: ')).toLowerCase();
    }

    // 공통 옵션 입력
    // scale (0~1)
    let scaleStr = await ask('워터마크의 이미지 너비 비율(scale)을 입력하세요 (0~1, 기본값 0.7): ');
    let scale = parseFloat(scaleStr);
    if (isNaN(scale) || scale <= 0 || scale > 1) {
      scale = 0.7;
    }
    // opacity
    let opacityStr = await ask('워터마크의 투명도(opacity)를 입력하세요 (0~1, 기본값 0.5): ');
    let opacity = parseFloat(opacityStr);
    if (isNaN(opacity) || opacity < 0 || opacity > 1) {
      opacity = 0.5;
    }
    // position
    let position = await ask('워터마크 위치를 선택하세요 (center, top-left, top-right, bottom-left, bottom-right) [center]: ');
    position = position.toLowerCase() || 'center';
    const validPositions = ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
    if (!validPositions.includes(position)) {
      position = 'center';
    }
    // 출력 형식
    let format = await ask('출력 이미지 형식을 선택하세요 (jpg/png) [원본과 동일]: ');
    format = format.toLowerCase();
    // we'll validate later per file

    // 출력 디렉터리
    let outDir = await ask('결과 이미지를 저장할 디렉터리를 입력하세요 (엔터 시 원본과 동일한 디렉터리): ');
    outDir = outDir.trim();
    if (outDir) {
      outDir = path.resolve(outDir);
      if (!fs.existsSync(outDir)) {
        try {
          fs.mkdirSync(outDir, { recursive: true });
        } catch (err) {
          console.error(`출력 디렉터리를 생성할 수 없습니다: ${err.message}`);
          rl.close();
          return;
        }
      }
    }

    // 덮어쓰기 옵션
    let overwriteOption = await ask('이미 존재하는 결과 파일이 있을 경우 어떻게 할까요? (o: overwrite, s: skip, a: ask each time) [a]: ');
    overwriteOption = overwriteOption.toLowerCase() || 'a';
    if (!['o', 's', 'a'].includes(overwriteOption)) {
      overwriteOption = 'a';
    }

    // 텍스트 워터마크 옵션
    let textOpts = null;
    let watermarkBuffer = null;
    let isTextWatermark = false;
    
    if (wmType === 'text') {
      isTextWatermark = true;
      let wmText = await ask('워터마크로 사용할 텍스트를 입력하세요: ');
      while (!wmText) {
        wmText = await ask('텍스트를 입력해야 합니다: ');
      }
      let fontFamily = await ask('글꼴(font family)을 입력하세요 [Arial]: ');
      fontFamily = fontFamily || 'Arial';
      let fontSizeStr = await ask('글자 크기(font size)를 입력하세요 (숫자) [48]: ');
      let fontSize = parseInt(fontSizeStr, 10);
      if (isNaN(fontSize) || fontSize <= 0) {
        fontSize = 48;
      }
      let color = await ask('글자 색상(color)을 입력하세요 (예: #FFFFFF 또는 rgba(255,255,255,0.5)) [#FFFFFF]: ');
      color = color || '#FFFFFF';
      let boldInput = await ask('굵게(bold) 표시할까요? (y/n) [n]: ');
      const bold = boldInput.toLowerCase() === 'y';
      let italicInput = await ask('기울임(italic) 표시할까요? (y/n) [n]: ');
      const italic = italicInput.toLowerCase() === 'y';
      textOpts = { text: wmText, fontFamily, fontSize, color, bold, italic };
      const svgBuffer = createTextWatermarkSVG({ ...textOpts, opacity });
      // 생성한 SVG를 PNG로 변환
      watermarkBuffer = await sharp(svgBuffer).png().toBuffer();
    } else {
      // 이미지 워터마크
      let wmImgPath = await ask('워터마크 이미지 파일 경로를 입력하세요: ');
      while (!wmImgPath) {
        wmImgPath = await ask('경로를 입력해야 합니다: ');
      }
      wmImgPath = path.resolve(wmImgPath);
      if (!fs.existsSync(wmImgPath) || !isSupportedImage(wmImgPath)) {
        console.error('워터마크 이미지가 존재하지 않거나 지원되지 않는 형식입니다.');
        rl.close();
        return;
      }
      watermarkBuffer = fs.readFileSync(wmImgPath);
    }

    // error log 준비
    const errorLogPath = path.resolve(process.cwd(), 'error.log');
    // 기존 error.log 초기화
    try {
      fs.writeFileSync(errorLogPath, '');
    } catch (err) {
      // ignore
    }
    let overwriteAll = overwriteOption === 'o';
    let skipAll = overwriteOption === 's';

    for (const inputFile of filesToProcess) {
      try {
        // 입력 파일 메타
        const ext = path.extname(inputFile).toLowerCase().replace('.', '');
        let outFormat = format;
        if (!['jpg', 'jpeg', 'png'].includes(outFormat)) {
          // 지정하지 않으면 원본과 동일
          outFormat = ext === 'jpeg' ? 'jpg' : ext;
        }
        // 출력 디렉터리
        const targetDir = outDir || path.dirname(inputFile);
        const outputPath = generateOutputName(inputFile, targetDir, outFormat);
        // 파일 존재 시 처리
        let proceed = true;
        if (fs.existsSync(outputPath)) {
          if (overwriteAll) {
            proceed = true;
          } else if (skipAll) {
            proceed = false;
          } else {
            // ask each time
            const choice = await ask(`파일 ${outputPath} 가 이미 존재합니다. 덮어쓸까요? (y/n) `);
            if (choice.toLowerCase() === 'y') {
              proceed = true;
            } else {
              proceed = false;
            }
          }
        }
        if (!proceed) {
          console.log(`${path.basename(outputPath)} 생성을 건너뜁니다.`);
          continue;
        }
        // 워터마크 적용
        await applyWatermark(inputFile, watermarkBuffer, scale, position, opacity, outFormat, outputPath, isTextWatermark);
        console.log(`${path.basename(outputPath)} 저장 완료.`);
      } catch (err) {
        // 에러 로그 기록
        const msg = `${inputFile} - ${err.message}\n`;
        try {
          fs.appendFileSync(errorLogPath, msg);
        } catch (e) {
          // ignore
        }
        console.error(`${inputFile} 처리 중 오류 발생: ${err.message}`);
      }
    }

    console.log('\n모든 작업이 완료되었습니다.');
  } catch (err) {
    console.error('예상치 못한 오류가 발생했습니다:', err.message);
  } finally {
    rl.close();
  }
}

main();