// /edit 저장본(주인 구글 드라이브의 JSON 한 개)을 읽어 data.ts 기본값 위에 덮는다.
// 클라이언트 ID·API 키는 공개해도 되는 값이다(API 키는 artmug.temis.kr·kwakori.github.io + Drive API로 제한).
// 손님(판매자)마다 artmug.temis.kr/<id>/ 와 /<id>/edit 을 쓴다. 손님 목록은 src/clients.json.
import clients from "../clients.json";
import { doc, type Doc } from "./data";

interface Client {
  name: string;
  /** /<id>/edit 첫 저장 때 만든 파일 ID. 비어 있으면 페이지는 data.ts 기본값만 쓴다. */
  fileId: string;
}
const CLIENTS: Record<string, Client> = clients;

/** 주소 첫 칸이 손님 id. 목록에 없으면(맨 앞 주소 등) 주인 페이지(temis). */
export const SLUG = (() => {
  const first = location.pathname.split("/").filter(Boolean)[0] ?? "";
  return first in CLIENTS ? first : "temis";
})();

export const REMOTE = {
  clientId: "76722884494-r8of5elhefhh1j0583rbr8i9dpo5ihai.apps.googleusercontent.com",
  apiKey: "AIzaSyB3GzQ2fz2c_s03WkvD5nNd_UL10YZLk3c",
  name: CLIENTS[SLUG].name,
  fileId: CLIENTS[SLUG].fileId,
  fileName: `artmug-page-${SLUG}.json`,
};

/** /edit이 고치는 중인 내용(미리보기 iframe이 읽음) */
export const DRAFT_KEY = `artmug-draft-${SLUG}`;
/** 처음 저장해 만든 파일 ID(clients.json에 넣기 전까지 이 브라우저에서 씀) */
export const FILE_ID_KEY = `artmug-file-id-${SLUG}`;

export const DEFAULT_DOC: Doc = structuredClone(doc);

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** base 모양을 기준으로 over 값을 덮는다. 모양이 다른 값은 버려서, 저장본이 오래돼도 페이지가 깨지지 않게 한다. */
export function merge<T>(base: T, over: unknown): T {
  if (isObj(base)) {
    if (!isObj(over)) return base;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(base)) out[k] = k in over ? merge(base[k], over[k]) : base[k];
    return out as T;
  }
  if (Array.isArray(base)) return (Array.isArray(over) ? over : base) as T;
  return (typeof over === typeof base ? over : base) as T;
}

export function applyDoc(next: unknown) {
  Object.assign(doc, merge(DEFAULT_DOC, next));
}

export const fileId = () => REMOTE.fileId || localStorage.getItem(FILE_ID_KEY) || "";

/** 게시된 저장본을 로그인 없이 읽는다(파일은 「링크가 있는 모든 사용자」 보기). */
export async function fetchPublished(): Promise<unknown | null> {
  const id = fileId();
  if (!id || !REMOTE.apiKey) return null;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 3000);
  try {
    const r = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${REMOTE.apiKey}`, { cache: "no-store", signal: ctl.signal });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export const readDraft = (): unknown | null => {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
  } catch {
    return null;
  }
};
