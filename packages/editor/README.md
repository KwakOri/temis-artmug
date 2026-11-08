# @artmug/editor — 아트머그 상세페이지 공통 편집기

에디터는 한 벌, 디자인만 손님마다. 손님 저장소에는 아래 세 가지만 둔다.

| 손님마다 다른 것 | 어디 |
|---|---|
| 디자인(화면 코드·CSS) | `src/page/…`, `src/index.css` |
| 칸 목록(무엇을 고칠 수 있는지) | `src/editor.schema.tsx` |
| 내용 | `public/content.json` (+ 사진 폴더) |

엔진이 하는 일: `/edit` 폼 패널, 미리보기 눌러 고치기(파란 점선·PC 팝오버·폰 아래 시트), 사진 바꾸기·여러 장 추가(브라우저에서 줄여 webp 두 벌), 깃허브 토큰으로 `content.json`과 사진을 커밋 하나로 저장, 배포 확인.

## 손님 사이트에서 쓰는 곳 (네 군데)

```tsx
// src/main.tsx — 손님 화면
import { startPage } from "@artmug/editor";
startPage(schema, () => root.render(<App />)); // content.json(또는 /edit 초안)을 schema.defaults에 덮고 그린다

// src/edit/main.tsx — /edit
import "../index.css";
import { mountEditor } from "@artmug/editor/editor";
mountEditor(schema);
```

```css
/* src/index.css */
@import "tailwindcss";
@import "@artmug/editor/editor.css";   /* 점선·빛남 스타일, 편집기 클래스 */
@theme { --color-ed-accent: #fc712b; } /* 편집기 색: ed-ink · ed-accent · ed-line · ed-soft (안 적으면 기본 파랑·회색) */
```

디자인에서는 고칠 수 있는 글자·사진에 `data-edit="<content.json 경로>"`만 붙인다. 사진 주소는 `photoUrl(dir, src, "s" | "l")`로 만든다(/edit 미리보기에서 아직 저장 안 한 사진도 보이게).

```tsx
<h3 data-edit={`benefits.${i}.title`}>{b.title}</h3>
<img data-edit={`works.items.${i}.src`} src={photoUrl("works", w.src, "s")} />
```

점선을 붙일지, 누르면 무엇을 할지는 엔진이 칸 목록과 값의 종류로 정한다.
- 글자(string) → 그 자리 입력창
- `photos`에 적은 칸 → 사진 바꾸기
- 숫자·참거짓·고르기 칸·목록 → 왼쪽 칸 목록의 그 줄로 옮겨 감
- `hidden`에 적었거나 content.json에 없는 경로 → 점선 없음, 눌러도 페이지 동작 그대로

## 새 손님 세우기

1. 손님 깃허브에 저장소를 만든다(주인/손님 몫. 우리 토큰은 저장소를 못 만든다). 테미스 저장소(`KwakOri/temis-artmug`)를 뼈대로 복사하되 `src/page`·`src/assets`·`public/works`·`public/drafts`는 손님 디자인으로 바꾼다. 남길 것: `vite.config.ts`, `edit.html`, `.github/workflows/deploy.yml`, `src/main.tsx`, `src/edit/main.tsx`, `src/site.ts`.
2. `package.json`에 `"@artmug/editor": "github:KwakOri/artmug-editor#v<지금 버전>"`(템플릿 저장소 전에는 `packages/editor` 폴더를 복사해 `file:packages/editor`).
3. `src/site.ts`에 손님 저장소 `owner`·`repo`·`branch`.
4. 디자인 기본값(`src/page/data.ts`의 `doc`)을 만들고, 화면에서 고칠 글자·사진에 `data-edit` 경로를 붙인다. 사진은 `photoUrl`.
5. `src/editor.schema.tsx`에 칸 이름·고르기·숨김·사진·설명을 적는다(테미스 것을 고쳐 쓰면 빠르다).
6. `src/index.css`에서 `@artmug/editor/editor.css`를 불러오고 편집기 색(`--color-ed-*`)을 손님 색으로.
7. `public/content.json`은 처음엔 비워 두거나(`{}`) 기본값 그대로. `public/CNAME`은 손님 주소로(없으면 지움).
8. `npm run build`가 되면 main에 올린다 → Actions가 gh-pages에 배포. 저장소 Settings → Pages가 「gh-pages / (root)」인지 확인.
9. 손님에게 `/edit` 주소와 토큰 만드는 법(편집기 ⚙ 깃허브 연결에 적혀 있음)을 안내한다.

확인: `/edit`에서 점선 글자 눌러 고치기, 사진 바꾸기, 저장 뒤 1~2분에 「적용됐어요」.

## 칸 목록(schema) 필드

`defineSchema({...})` — 자세한 설명은 `src/schema.ts` 주석.

| 필드 | 뜻 |
|---|---|
| `site` | 저장할 깃허브 저장소 `{ owner, repo, branch }` |
| `defaults` | 디자인 기본값 객체(content.json 모양). `startPage`가 여기에 덮어쓴다 |
| `labels` | 칸 이름 → 보이는 이름 (`title`처럼 이름 단위, `works.title`처럼 경로 단위 둘 다) |
| `choices` | 고르기 칸 → `[값, 보이는 이름][]` |
| `hidden` | 숨길 칸 |
| `fixedLists` | 항목 수를 못 바꾸는 목록(순서만) |
| `longText` | 늘 여러 줄 입력인 칸 이름 |
| `photos` | 사진 칸 → `{ dir, sizes?, missing? }` (파일: `public/<dir>/<값>-s.webp`, `-l.webp`) |
| `hints` | 칸 경로 → 입력창 아래 설명(문자열 또는 `(d) => 문자열`) |
| `tabOf` | 다른 탭 맨 위에 같이 보일 칸. `{ brand: "hero" }` |
| `bulk` | 사진 여러 장 한꺼번에 추가 `{ list, photo, choose?, title, note? }` |
| `logo`, `title`, `panelNote`, `itemTitle`, `contentPath` | 머리 로고·제목, 패널 아래 도움말, 목록 항목 머리 이름 칸, content.json 위치 |

## 버전 따라가기

엔진은 빌드하지 않은 TypeScript 소스 그대로 npm 패키지로 쓴다(Vite가 손님 사이트 빌드 때 같이 컴파일). 버전은 git 태그.

- 지금(템플릿 저장소 전): 테미스 저장소 안 `packages/editor`를 `"@artmug/editor": "file:packages/editor"`로 쓴다.
- 템플릿 저장소(`KwakOri/artmug-editor`, 공개)가 생기면: 이 폴더 내용을 그 저장소 맨 위에 두고 `v0.1.0`처럼 태그를 단다. 손님 저장소는
  ```json
  "dependencies": { "@artmug/editor": "github:KwakOri/artmug-editor#v0.1.0" }
  ```
  고치기를 따라오려면 태그만 바꾸고 `npm install` → `package-lock.json`과 같이 커밋 → Actions가 다시 배포. 태그를 안 바꾼 손님은 그대로 옛 버전이다.
- 엔진을 고치면 `package.json`의 `version`을 올리고 같은 이름으로 태그를 단다. 칸 목록 모양을 바꾸는 변경(필드 이름 바꾸기·지우기)은 가운데 숫자를 올리고(0.1 → 0.2) 아래 「바뀐 것」에 옮기는 방법을 적는다.
- 손님 저장소에서 패키지를 못 받는 일이 없게 템플릿 저장소는 공개로 둔다(손님 Actions에는 우리 토큰이 없다).

## 바뀐 것

- 0.1.0 (2026-11-08): 테미스 편집기(큐 #42·#43)에서 떼어 냄.
