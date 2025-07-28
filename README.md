# 📷 watermark-cli

**🇰🇷 대상 이미지에 텍스트 또는 이미지 워터마크를 간단히 추가할 수 있는 Node.js CLI 도구입니다.**  
**🇺🇸 A lightweight Node.js CLI tool for adding text or image watermarks to your images.**

개인적인 용도로 사용하기 위해 생성한 프로젝트이며, 이미지에 *라이트하게 워터마크를 입히는 데* 초점을 두고 있습니다.  
This project was originally created for personal use, with a focus on applying watermarks in a simple and lightweight manner.  
같은 문제를 겪는 분들께 작게나마 도움이 되기를 바랍니다.  
I hope it serves as a small help for others facing similar needs.

> 🇰🇷 지속적인 유지보수나 기능 확장 계획은 없습니다.  
> 🇰🇷 더 많은 기능이나 정교한 설정이 필요한 경우, 이미 잘 만들어진 성숙한 라이브러리 사용을 권장드립니다.  
> 🇺🇸 There are no plans for ongoing maintenance or feature expansion.  
> 🇺🇸 If you require more advanced features, please consider using a mature library better suited for your needs.

---

## ✨ 주요 기능 / Features

- ✅ **텍스트 워터마크 / Text Watermark**
  - 글꼴, 크기, 색상, 굵기, 기울임, 투명도 설정 가능  
    Customizable font, size, color, bold/italic style, and opacity
	
- ✅ **이미지 워터마크 / Image Watermark**
  - 외부 이미지 삽입 및 크기/투명도 조절  
    Supports external watermark images with scaling and transparency
	
- ✅ **포맷 지원 / Format Support**
  - JPG, PNG 형식 처리 및 저장  
    Input/output support for JPG and PNG
	
- ✅ **위치 지정 / Positioning**
  - `center`, `top-left`, `top-right`, `bottom-left`, `bottom-right`  
    Position watermark as needed
	
- ✅ **일괄 처리 / Batch Processing**
  - 여러 이미지 또는 폴더 단위 일괄 처리  
    Process multiple images or entire folders
	
- ✅ **파일 충돌 처리 / File Conflict Handling**
  - 덮어쓰기, 건너뛰기, 매번 확인  
    Choose from overwrite, skip, or ask
	
- ✅ **에러 로그 기록 / Error Logging**
  - `error.log`에 자동 기록  
    Errors are logged automatically

---

## 🚀 사용법 / Getting Started

```bash
git clone https://github.com/dev-tori/watermark-cli.git
cd watermark-cli
npm install
npm start
```

실행 후 CLI에서 다음 항목들을 입력합니다:  
You will be prompted to enter the following:

1. 이미지 경로 (파일/폴더, 복수 입력 시 `,`로 구분)  
   Image path(s) (file/folder, comma-separated)
   
2. 워터마크 종류 (`text` 또는 `image`)  
   Watermark type (`text` or `image`)
   
3. 크기 비율 (기본: `0.7`)  
   Watermark scale ratio (default: `0.7`)
   
4. 투명도 (`0~1`, 기본: `0.5`)  
   Opacity (`0~1`, default: `0.5`)
   
5. 위치 (기본: `center`)  
   Watermark position (default: `center`)
   
6. 출력 포맷 (입력 없으면 원본 유지)  
   Output format (defaults to original format if empty)
   
7. 저장 디렉토리  
   Output directory
   
8. 동일 파일 존재 시 처리 방식 (o: overwrite, s: skip, a: ask)  
   File conflict behavior (o: overwrite, s: skip, a: ask)

### 텍스트 워터마크인 경우 / If Text Watermark:

- 워터마크 텍스트 / Text content
- 글꼴 (`Arial` 기본) / Font (`Arial` default)
- 글자 크기 (`48` 기본) / Font size (`48` default)
- 색상 (`#RRGGBB` 또는 `rgba(...)`) / Color (`#RRGGBB` or `rgba(...)`)
- 굵기/기울임 설정 / Bold/Italic options

### 이미지 워터마크인 경우 / If Image Watermark:

- 워터마크 이미지 경로 / Path to image file

---

## 🧪 지원 포맷 / Supported Formats

- 입력 / Input: `.jpg`, `.jpeg`, `.png`  
- 출력 / Output: `.jpg`, `.png`

---

## 📦 의존 패키지 / Dependencies

- [`sharp`](https://github.com/lovell/sharp)
- [`inquirer`](https://github.com/SBoudrias/Inquirer.js)
- [`commander`](https://github.com/tj/commander.js)

---

## 📄 라이선스 / License

[MIT](./LICENSE)

---

## 👤 작성자 / Author

**dev-tori**  
📧 lsy904732@gmail.com
