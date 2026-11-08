// 칸 목록(스키마): 손님 사이트가 「무엇을 고칠 수 있는지」를 적는 파일의 모양.
// 편집기 패널, 미리보기 점선 대상, 사진 저장 위치가 모두 여기서 나온다. 에디터 코드는 손님마다 바꾸지 않는다.
//
// 경로 표기
// - 「칸 이름」(name): content.json 안 마지막 이름. 예) title, body, price
// - 「칸 경로」(key): 번호를 뺀 점 경로. 예) works.items.src (works.items.3.src 모두)
// - 「전체 경로」(path): 번호까지. 예) works.items.3.src — 디자인의 data-edit 값이 이것이다.
import type { ReactNode } from "react";

export type Json = unknown;
export type Path = (string | number)[];

export interface Site {
  owner: string;
  repo: string;
  branch: string;
}

export interface PhotoSpec {
  /** public/ 아래 사진 폴더. 파일은 <dir>/<값>-s.webp(목록용), -l.webp(확대용) */
  dir: string;
  /** 긴 변 최대 길이(px). 기본 s 720 · l 1600 */
  sizes?: { s: number; l: number };
  /** 사진이 빈 항목이 있을 때 저장을 막으며 보여 줄 말 */
  missing?: string;
}

export interface BulkSpec {
  /** 사진을 붙일 목록의 칸 경로. 예) works.items */
  list: string;
  /** 그 목록 항목 안의 사진 칸 이름. 예) src */
  photo: string;
  /** 한 번에 고르는 값(선택 칸). 예) { field: "cat", default: "unstructured" } — 고를 수 있는 값은 choices[field] */
  choose?: { field: string; default: string };
  title: string;
  note?: string;
}

/** 칸마다 입력창 아래 붙는 설명. 함수면 지금 내용(d)과 그 칸의 전체 경로(path)를 보고 만든다. */
export type Hint = string | ((d: any, path: Path) => string);

export interface Schema<D extends object = Record<string, Json>> {
  /** 저장할 깃허브 저장소 */
  site: Site;
  /** 디자인의 기본값(data.ts의 doc). content.json은 이 모양 위에 덮인다. */
  defaults: D;
  /** 편집기 머리 왼쪽(로고) */
  logo?: ReactNode;
  /** 편집기 머리 제목. 기본 「상세페이지 고치기」 */
  title?: (d: D) => string;
  /** 칸 이름 → 사람이 읽는 이름. 이름 단위(title)든 칸 경로 단위(works.title)든 된다(경로가 우선). */
  labels?: Record<string, string>;
  /** 고르기 칸: 칸 이름 또는 칸 경로 → [값, 보이는 이름] */
  choices?: Record<string, [string, string][]>;
  /** 숨기는 칸(이름 또는 칸 경로). 패널에 안 나오고 미리보기 점선도 안 붙는다. */
  hidden?: string[];
  /** 항목 수를 바꾸면 안 되는 목록(칸 경로). 순서만 바꾼다. */
  fixedLists?: string[];
  /** 여러 줄 입력으로 보일 칸 이름(그 밖에는 40자가 넘거나 줄바꿈이 있으면 여러 줄) */
  longText?: string[];
  /** 사진 칸(칸 경로 → 사진 설정). 값은 사진 이름(src) 문자열이다. */
  photos?: Record<string, PhotoSpec>;
  /** 칸 경로 → 입력창 아래 설명 */
  hints?: Record<string, Hint[]>;
  /** 다른 탭에 같이 보일 맨 위 칸. 예) { brand: "hero" } — brand를 「첫 화면」 탭 맨 위에 */
  tabOf?: Record<string, string>;
  /** 목록 항목 머리에 보일 이름으로 쓸 칸(앞에 있는 것부터). 기본 name·title·label·quote */
  itemTitle?: string[];
  /** 사진 여러 장 한꺼번에 추가(없으면 안 보임) */
  bulk?: BulkSpec;
  /** 칸 목록 아래 도움말 */
  panelNote?: ReactNode;
  /** content.json 위치. 기본 public/content.json */
  contentPath?: string;
}

export const defineSchema = <D extends object>(s: Schema<D>) => s;

export const keyOf = (p: Path) => p.filter((x) => typeof x === "string").join(".");
/** "reviews.2.body" → ["reviews", 2, "body"] */
export const parsePath = (s: string): Path => s.split(".").map((x) => (/^\d+$/.test(x) ? Number(x) : x));
export const nameOf = (p: Path) => String([...p].reverse().find((x) => typeof x === "string") ?? "");
export const isObj = (v: Json): v is Record<string, Json> => !!v && typeof v === "object" && !Array.isArray(v);
export const getIn = (root: Json, path: Path): Json => path.reduce<Json>((v, k) => (v == null ? v : (v as Record<string | number, Json>)[k]), root);

export function setIn(root: Json, path: Path, v: Json): Json {
  if (!path.length) return v;
  const [h, ...rest] = path;
  if (Array.isArray(root)) return root.map((x, i) => (i === h ? setIn(x, rest, v) : x));
  return { ...(root as object), [h]: setIn((root as Record<string, Json>)[h as string], rest, v) };
}

export const labelOf = (s: Schema<any>, name: string, key = "") => s.labels?.[key] ?? s.labels?.[name] ?? name;
export const choicesOf = (s: Schema<any>, name: string, key = "") => s.choices?.[key] ?? s.choices?.[name];
export const isHidden = (s: Schema<any>, path: Path) => {
  const h = s.hidden ?? [];
  return h.includes(nameOf(path)) || h.includes(keyOf(path));
};
export const photoOf = (s: Schema<any>, path: Path) => s.photos?.[keyOf(path)];

/** 미리보기에서 누른 칸을 어떻게 고칠지: 글자·숫자는 그 자리 입력창, 사진은 사진 바꾸기, 나머지(고르기·참거짓·목록·순서)는 칸 목록으로 */
export function kindOf(s: Schema<any>, path: Path, v: Json): "text" | "number" | "photo" | "panel" | null {
  if (v === undefined || isHidden(s, path)) return null;
  if (photoOf(s, path)) return "photo";
  if (choicesOf(s, nameOf(path), keyOf(path))) return "panel";
  return typeof v === "string" ? "text" : typeof v === "number" ? "number" : "panel";
}

/** "후기 › 3번 › 본문" */
export const describe = (s: Schema<any>, path: Path) =>
  path.map((x, i) => (typeof x === "number" ? `${x + 1}번` : labelOf(s, x, keyOf(path.slice(0, i + 1))))).join(" › ");

export const hintsFor = (s: Schema<any>, path: Path, d: Json) => (s.hints?.[keyOf(path)] ?? []).map((h) => (typeof h === "function" ? h(d, path) : h));

/** 내용 안의 모든 사진: 사진 이름 → 사진 설정(빈 값 제외) */
export function photosIn(s: Schema<any>, d: Json): Map<string, PhotoSpec> {
  const out = new Map<string, PhotoSpec>();
  if (!s.photos) return out;
  const walk = (v: Json, path: Path) => {
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, [...path, i]));
    else if (isObj(v)) for (const [k, x] of Object.entries(v)) walk(x, [...path, k]);
    else if (typeof v === "string" && v) {
      const spec = photoOf(s, path);
      if (spec) out.set(v, spec);
    }
  };
  walk(d, []);
  return out;
}

/** 사진 칸인데 비어 있는 첫 경로 */
export function missingPhoto(s: Schema<any>, d: Json): Path | null {
  let found: Path | null = null;
  const walk = (v: Json, path: Path) => {
    if (found) return;
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, [...path, i]));
    else if (isObj(v)) for (const [k, x] of Object.entries(v)) walk(x, [...path, k]);
    else if (v === "" && photoOf(s, path)) found = path;
  };
  walk(d, []);
  return found;
}
