// 구글 로그인(GIS 토큰 방식) + Drive 저장. 권한은 drive.file(이 앱이 만든 파일만)뿐이다.
// 토큰은 1시간짜리라 메모리에만 두고, 저장할 때마다 필요하면 다시 받는다.
import { FILE_ID_KEY, REMOTE, fileId } from "../page/remote";

const SCOPE = "https://www.googleapis.com/auth/drive.file";

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}
interface TokenClient {
  callback: (r: TokenResponse) => void;
  error_callback?: (e: { type: string }) => void;
  requestAccessToken: (o?: { prompt?: string }) => void;
}
declare global {
  interface Window {
    google?: { accounts: { oauth2: { initTokenClient: (c: object) => TokenClient } } };
  }
}

let gis: Promise<void> | null = null;
const loadGis = () =>
  (gis ??= new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = () => ok();
    s.onerror = () => fail(new Error("구글 로그인 스크립트를 못 불러왔어요"));
    document.head.appendChild(s);
  }));

let token = "";
let expires = 0;
export const signedIn = () => !!token && Date.now() < expires;

/** 버튼 클릭 안에서 불러야 팝업이 막히지 않는다. */
export async function signIn(): Promise<string> {
  if (signedIn()) return token;
  await loadGis();
  return new Promise((ok, fail) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: REMOTE.clientId,
      scope: SCOPE,
      callback: () => {},
    });
    client.callback = (r) => {
      if (!r.access_token) return fail(new Error(r.error ?? "로그인이 취소됐어요"));
      token = r.access_token;
      expires = Date.now() + ((r.expires_in ?? 3600) - 60) * 1000;
      ok(token);
    };
    client.error_callback = (e) => fail(new Error(e.type === "popup_closed" ? "로그인 창을 닫았어요" : `로그인 실패: ${e.type}`));
    client.requestAccessToken({ prompt: "" });
  });
}

async function api(url: string, init: RequestInit = {}) {
  const t = await signIn();
  const r = await fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${t}` } });
  if (!r.ok) {
    const msg = await r.text().catch(() => "");
    throw new Error(`구글 드라이브 오류 ${r.status}${r.status === 404 ? " (파일이 없거나 다른 구글 계정이에요)" : ""} ${msg.slice(0, 200)}`);
  }
  return r;
}

/** 로그인한 계정으로 저장본을 읽는다(게시 전 확인용). */
export async function loadSaved(): Promise<unknown | null> {
  const id = fileId();
  if (!id) return null;
  const r = await api(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, { cache: "no-store" });
  return r.json();
}

/** 저장. 파일이 없으면 만들고 「링크가 있는 모든 사용자 보기」로 공개한다. 돌려주는 값: 새로 만들었으면 파일 ID. */
export async function save(data: unknown): Promise<string | null> {
  const body = JSON.stringify(data, null, 2);
  const id = fileId();
  if (id) {
    await api(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
    });
    return null;
  }
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify({ name: REMOTE.fileName, mimeType: "application/json" })], { type: "application/json" }));
  form.append("file", new Blob([body], { type: "application/json" }));
  const made: { id: string } = await (await api("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", { method: "POST", body: form })).json();
  await api(`https://www.googleapis.com/drive/v3/files/${made.id}/permissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });
  localStorage.setItem(FILE_ID_KEY, made.id);
  return made.id;
}
