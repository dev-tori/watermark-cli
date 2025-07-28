# 📷 watermark-cli

**이미지에 텍스트 또는 이미지 워터마크를 추가하는 Node.js CLI 도구**  
JPG 또는 PNG 이미지에 텍스트 또는 이미지 형태의 워터마크를 손쉽게 삽입할 수 있습니다.  
단일 파일, 다중 파일 또는 폴더 단위로 처리할 수 있으며, 다양한 커스터마이징 옵션을 제공합니다.

## ✨ 주요 기능

- ✅ **텍스트 워터마크**
  - 글꼴, 크기, 색상, 굵기, 기울임, 투명도 설정 가능
- ✅ **이미지 워터마크**
  - 외부 이미지로 워터마크 삽입
  - 크기 조정 및 투명도 적용
- ✅ **포맷 지원**
  - JPG, PNG 이미지 파일 처리 및 저장
- ✅ **위치 지정**
  - `center`, `top-left`, `top-right`, `bottom-left`, `bottom-right` 위치 지원
- ✅ **배치 처리**
  - 여러 이미지 또는 폴더 내 이미지 일괄 워터마크 적용
- ✅ **충돌 처리**
  - 기존 파일 존재 시 덮어쓰기, 건너뛰기, 매번 확인 중 선택 가능
- ✅ **에러 로그 기록**
  - 처리 중 오류 발생 시 `error.log`에 기록

## 🚀 사용법

```bash
git clone https://github.com/dev-tori/watermark-cli.git
cd watermark-cli
npm install
npm start
```

실행 후, 다음 항목에 대한 순차적 입력을 통해 워터마크를 적용할 수 있습니다:

1. 처리할 이미지 경로 (파일 또는 폴더, 여러 개는 `,`로 구분)
2. 워터마크 종류 (`text` 또는 `image`)
3. 워터마크 크기 비율 (기본: `0.7`)
4. 투명도 (`0~1`, 기본: `0.5`)
5. 워터마크 위치 (기본: `center`)
6. 출력 이미지 포맷 (입력 없으면 원본 유지)
7. 결과 이미지 저장 디렉토리
8. 같은 이름의 파일이 있을 경우 처리 방법 (o: overwrite, s: skip, a: ask)

### 텍스트 워터마크 선택 시

- 워터마크 텍스트
- 글꼴 (기본: `Arial`)
- 글자 크기 (기본: `48`)
- 색상 (`#RRGGBB` 또는 `rgba(...)`)
- 굵기 및 기울임 설정

### 이미지 워터마크 선택 시

- 워터마크 이미지 파일 경로 입력

## 🧪 지원 이미지 포맷

- 입력: `.jpg`, `.jpeg`, `.png`
- 출력: `.jpg`, `.png`

## 📦 의존성

- [`sharp`](https://github.com/lovell/sharp)
- [`inquirer`](https://github.com/SBoudrias/Inquirer.js)
- [`commander`](https://github.com/tj/commander.js)

## 📄 라이선스

[MIT](./LICENSE)

## 👤 작성자

**dev-tori**  
📧 lsy904732@gmail.com
