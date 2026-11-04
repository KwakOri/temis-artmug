// 게시된 내용(public/content.json)을 읽어 data.ts 기본값 위에 덮는다.
// content.json은 /edit 편집기가 깃허브에 커밋하고, GitHub Actions가 배포한다.
import { doc, type Doc } from "./data";

/** /edit이 고치는 중인 내용(미리보기 iframe이 읽음) */
export const DRAFT_KEY = "artmug-draft";
/** 아직 커밋 안 한 새 작업물 이미지(미리보기용 data URL). { [src]: { s, l } } */
export const PENDING_KEY = "artmug-pending-images";

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

/** 배포된 content.json. 페이지(HTML)는 깃허브가 10분 캐시하므로 매번 새로 받는다. */
export async function fetchPublished(): Promise<(Record<string, unknown> & { updatedAt?: string }) | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}content.json?t=${Date.now()}`, { cache: "no-store", signal: ctl.signal });
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

type Pending = Record<string, { s: string; l: string }>;
let pendingCache: [string | null, Pending] = [null, {}];
/** 미리보기에서 그림마다 부르므로, 저장된 글자가 같으면 다시 파싱하지 않는다. */
export const readPending = (): Pending => {
  const raw = localStorage.getItem(PENDING_KEY);
  if (raw !== pendingCache[0]) {
    try {
      pendingCache = [raw, JSON.parse(raw ?? "{}") ?? {}];
    } catch {
      pendingCache = [raw, {}];
    }
  }
  return pendingCache[1];
};
