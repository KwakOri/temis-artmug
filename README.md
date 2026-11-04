# Temis 맞춤 시간표 — 아트머그 상세페이지

https://artmug.temis.kr/ (예전 kwakori.github.io/temis-artmug/는 이리로 넘어옴, 편집기는 /edit) — 아트머그 본문 iframe에 넣는 상세페이지 전체.
칸: 첫 화면 · 혜택 · 작업물 · 체험존 · 후기 · 가격 · 작업 자리(시트) · 진행 · 주의사항 · 신청 양식.

- `src/page/data.ts`: 모든 문구·가격 기본값(나중에 /edit가 덮어씀). 작업물은 임시로 Temis 공개 포트폴리오(`public/works/`, webp).
- `src/page/pricing.ts`: 견적 계산(정액·%·별도 문의). 가격표·견적·복사 글이 같이 씀.
- `src/page/Slots.tsx`: 구글 시트 CSV(tokpi와 같은 틀). `slots.csvUrl`이 비면 숨김, `?slots=demo`로 예시.
- `src/DemoZone.tsx`: 시간표 체험존(요일 카드 1장 + 입력 세트). `?only=demo`로 체험존만 볼 수 있다.
- 저장·다운로드·로그인·외부 링크 없음.

## 실행 / 빌드

```bash
npm install
npm run dev       # 개발 서버
npm run build     # dist/ 생성 (base './' — GitHub Pages 하위 폴더 어디든 그대로 올리면 됨)
npm run preview   # dist/ 로컬 확인
```

iframe 예: `<iframe src="https://<계정>.github.io/<저장소>/" style="width:100%;height:720px;border:0"></iframe>`
(폰은 약 720px 고정 높이, iframe 안에서 스크롤 — 카드는 위에 붙어 따라옴)

## 화면
- 폰(≈360–420px): 카드가 폭에 꽉 차고 `sticky`로 위에 붙음 → 키보드가 올라와도 카드가 보임. 아래에 입력 세트.
- PC(≥768px): 카드 왼쪽, 입력 오른쪽.
- 입력이 바뀌면 카드가 잠깐 반짝(`.card-flash`, 동작 줄이기 설정이면 끔).
- 월~일 칩: 입력 카드 머리의 요일 글자와 카드의 날짜(이번 주 그 요일)가 바뀜. 원본 카드에는 요일 글자가 없고 날짜만 있음.

## 원본 파일 대응 (원본 시간표 저장소, dev 브랜치 — 원본은 손대지 않고 복사)

| 여기 | 원본 |
|---|---|
| `src/card/TimeTableCell.tsx` | `src/app/(root)/_sample/_components/TimeTableCell.tsx` (이미지 context → 로컬 import) |
| `src/card/AutoResizeText.tsx` | `src/components/AutoResizeTextCard/AutoResizeText.tsx` (+ 웹폰트 로드 뒤 다시 재기) |
| `src/card/settings.ts` | `_sample/_settings/settings.ts`, `general.ts` (카드에 필요한 값만) |
| `src/card/fonts.css` | `_sample/_styles/index.css` |
| `src/card/imgs.ts`, `src/assets/*.webp` | `_sample/_img/imgs.ts`, `_img/main/{online1,online2,offline}_Y2Kred.png` → webp |
| `src/card/CardStage.tsx` | (새로 씀) 800×617 원본 크기로 그리고 `transform: scale`로 줄임, 좌우 투명 여백 40px 잘라 냄 |
| `src/inputs/DayInput.tsx` | `_sample/_components/SampleTimeTableInputList.tsx` 하루치만 (isMultiple, 하루 최대 2개 = `_uneditable/TimeTableEditor.tsx`) |
| `src/inputs/{DayCard,EntryCard,SubToggle,Toggle,CardTitle,styles}` | `src/components/TimeTable/FixedComponents/*` 그대로 |
| `src/inputs/{AdaptiveTimeRenderer,ScrollableTimePicker,TextRenderer,TextareaRenderer}` | `src/components/TimeTable/fieldRenderer/*` 그대로 |
| `src/lib/format.ts` | `utils/date-formatter`(padZero), `utils/time-formatter`(formatTime), `utils/time-table/data`(weekdays) |
| `src/lib/utils.ts`, `types.ts` | `lib/utils`(cn), `utils/utils`(SizeProps), `types/time-table/data` |
| `src/index.css` `@theme` | `src/app/globals.css` `@theme` 의 timetable-* 색 |

상태: 원본의 TimeTableContext / LegacyTemplateAssetsContext 대신 `App.tsx`의 `useState` 하나.

## 글꼴
카드 글꼴(학교안심 알림장, 베이글팻)과 입력 UI 글꼴(Pretendard)은 jsdelivr CDN에서 불러온다.

## 손님(판매자) 페이지

- 손님마다 `https://artmug.temis.kr/<id>/`(상세페이지)와 `/<id>/edit`(편집기). 주인 페이지는 `temis`(맨 앞 주소도 temis).
- 손님 추가: `src/clients.json`에 `"<id>": { "name": "<이름>", "fileId": "" }` 한 줄 → 빌드·배포. id는 영문 소문자·숫자·-.
- 손님이 `/<id>/edit`에서 구글 로그인 → 저장하면 손님 드라이브에 `artmug-page-<id>.json`이 생기고 파일 ID가 뜬다. 그 ID를 `fileId`에 넣고 다시 배포해야 상세페이지에 반영된다.
- 구글 클라우드 프로젝트: tokpi-artmug(OAuth 클라이언트·API 키, `src/page/remote.ts`).
