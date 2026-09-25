# World Info Lens · 적용된 월드인포

입력창 아래 책 버튼으로 **최근 생성에서 활성화된 월드인포 항목**을 확인하는 독립 확장입니다.

- 책 버튼과 적용 개수: 입력 영역 맨 아래 고정 줄
- 팝업: 제목, 월드인포 이름, UID, 키워드, 내용을 확인하고 검색
- 모바일: 화면 너비에 가깝게 열리는 팝업, 내부 스크롤, 44px 이상 버튼
- Blue Lemonade: 아이콘 재배치 영역 밖에 버튼 배치, 팝업 스타일 격리
- 프롬프트나 월드인포 설정을 수정하지 않습니다. 외부 전송도 없습니다.

## 설치: GitHub 저장소 이용

1. ZIP을 내려받아 압축을 풉니다.
2. GitHub에서 새 저장소를 만듭니다. 예: `worldinfo-lens`.
3. 저장소의 **Add file → Upload files**에서 압축 안 `worldinfo-lens` 폴더의 **내용물**을 올립니다.
   - `manifest.json`, `index.js`, `style.css`, `README.md`
   - 저장소 첫 화면에 `manifest.json`이 보여야 합니다. 폴더째 올리거나 ZIP 자체를 올리지 마세요.
4. **Commit changes**를 누릅니다.
5. 실리태번 → 확장 메뉴 → 확장 설치 → 저장소 주소를 붙여 넣습니다.
6. 실리태번을 새로고침합니다. 이전 WorldInfoInfo 계열 확장은 끄면 버튼을 혼동하지 않습니다.
7. 메시지를 한 번 보내고 책 버튼을 누릅니다.

### 모바일 GitHub에서 파일 업로드가 실패한다면

GitHub의 **Add file → Create new file**로 파일 이름을 정확히 입력하고 각 파일 내용을 붙여 넣어 저장할 수 있습니다. 실행에 필요한 파일은 `manifest.json`, `index.js`, `style.css` 세 개입니다. `.js.txt`처럼 이중 확장자가 붙지 않게 확인하세요.

### 서버 파일에 직접 접근할 수 있다면

사용 중인 실리태번 사용자 데이터의 `extensions/worldinfo-lens/` 아래에 파일을 넣고 새로고침합니다. 일반적인 기본 사용자 경로는 `SillyTavern/data/default-user/extensions/worldinfo-lens/`입니다. 데이터 경로나 사용자 핸들을 바꿨다면 해당 경로를 사용하세요.

## 표시 의미

- `—`: 설치 직후, 새로고침 직후, 채팅 전환 직후. 아직 이 화면에서 생성 결과를 수신하지 않았습니다.
- `…`: 새 생성의 월드인포 결과를 기다리는 중입니다.
- 숫자: 최근 생성의 활성 항목 수. 월드인포 파일 수나 설정에서 켜둔 전체 항목 수가 아닙니다.
- `0`: 생성 프롬프트가 준비됐지만 활성 항목 이벤트가 없거나 목록이 비어 있습니다.

키워드 일치, 상시 활성, 확률·예산 등의 처리는 실리태번이 결정합니다. 이 확장은 `WORLD_INFO_ACTIVATED` 결과를 표시합니다. 실제 모델이 내용을 사용했는지, 다른 확장이 나중에 프롬프트를 제거했는지까지 판정하지 않습니다. 콘텐츠는 이벤트에 전달된 문자열이며 최종 전송 프롬프트 전체가 아닙니다.

재생성·이어쓰기에도 새 결과로 바뀝니다. 백그라운드 quiet 생성과 dry-run은 제외합니다. 그룹 채팅은 마지막으로 발생한 생성의 결과를 표시합니다. 이전 메시지별 이력은 보관하지 않습니다. 생성 중단 시 확인된 항목만 보여 줍니다. API 연결 전에 생성 자체가 실패하면 결과를 얻지 못할 수 있습니다.

## 호환성과 검증 범위

`SillyTavern.getContext()`의 `eventSource`, `eventTypes`, `WORLD_INFO_ACTIVATED`를 제공하는 버전이 필요합니다. 2026-09-25에 확인한 SillyTavern release 브랜치와 Blue Lemonade main 브랜치의 소스 구조를 기준으로 구현했습니다. 최신 Android Chrome 및 최신 Safari의 native dialog / Shadow DOM을 사용합니다.

로컬 테스트는 DOM 시뮬레이터에서 실리태번 이벤트와 팝업 열림·닫힘 API를 재현해 수행했습니다. 실제 브라우저 설치가 다운로드 오류로 막혀 모바일 레이아웃·native dialog·테마 전체 조합 및 실제 사용자 서버·API 동작은 검증하지 못했습니다. 다른 확장이 동시에 별도 생성을 시작하면 이벤트에 생성 ID가 없어 결과가 섞일 수 있습니다.

버튼이 안 보이면 확장 활성화와 파일 배치를 확인하고, 팝업은 열리는데 숫자가 바뀌지 않으면 설치 후 메시지를 새로 보내세요. 계속 문제가 생기면 실리태번 버전과 개발자 콘솔의 `[World Info Lens]` 오류를 확인해 주세요.

## 참고한 공식 소스

- https://github.com/SillyTavern/SillyTavern/blob/release/public/scripts/world-info.js
- https://github.com/SillyTavern/SillyTavern/blob/release/public/script.js
- https://github.com/kgangkgang/blue-lemonade/blob/main/css/04-send-form.css
- https://github.com/kgangkgang/blue-lemonade/blob/main/src/layout.js
