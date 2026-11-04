// 깃허브 저장: 손님이 만든 fine-grained 토큰(이 저장소 하나, Contents 읽기·쓰기)으로
// public/content.json과 public/works/ 이미지를 커밋 하나로 올린다. 토큰은 이 브라우저(localStorage)에만 둔다.
import { SITE } from "../site";

const TOKEN_KEY = "artmug-gh-token";
const API = `https://api.github.com/repos/${SITE.owner}/${SITE.repo}`;
export const CONTENT_PATH = "public/content.json";
export const WORKS_DIR = "public/works";

export const getToken = () => localStorage.getItem(TOKEN_KEY) ?? "";
export const forgetToken = () => localStorage.removeItem(TOKEN_KEY);

async function api<T>(path: string, init: RequestInit = {}, token = getToken()): Promise<T> {
  const r = await fetch(API + path, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!r.ok) {
    const why =
      r.status === 401 ? "토큰이 틀렸거나 기한이 지났어요. ⚙ 깃허브 연결에서 다시 넣어 주세요." : r.status === 403 || r.status === 404 ? "토큰에 이 저장소 쓰기 권한이 없어요(Contents: Read and write)." : "";
    throw Object.assign(new Error(`깃허브 오류 ${r.status}. ${why}`), { status: r.status });
  }
  return r.json();
}

/** 토큰을 확인하고 저장한다. 쓰기 권한이 없으면 실패. */
export async function connect(token: string) {
  const repo = await api<{ permissions?: { push?: boolean } }>("", {}, token);
  if (!repo.permissions?.push) throw new Error("이 토큰에는 쓰기 권한(Contents: Read and write)이 없어요.");
  localStorage.setItem(TOKEN_KEY, token);
}

const b64ToText = (b64: string) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) => c.charCodeAt(0)));

/** 저장소의 최신 content.json(배포 전이라도 가장 새것). 토큰이 없으면 공개 저장소로 읽는다. */
export async function loadContent(): Promise<unknown | null> {
  try {
    const f = await api<{ content: string }>(`/contents/${CONTENT_PATH}?ref=${SITE.branch}`);
    return JSON.parse(b64ToText(f.content));
  } catch {
    return null;
  }
}

const blobToB64 = (b: Blob) =>
  new Promise<string>((ok, fail) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1]);
    r.onerror = () => fail(r.error);
    r.readAsDataURL(b);
  });

interface TreeItem {
  path: string;
  mode: "100644";
  type: "blob";
  sha?: string | null;
  content?: string;
}

/**
 * 커밋 하나로 올린다. files: 새 이미지(경로 → Blob), remove: 지울 경로.
 * 그사이 누가 먼저 올렸으면(브랜치가 움직였으면) 한 번 다시 시도한다.
 */
export async function commit(content: unknown, files: Record<string, Blob>, remove: string[], message: string) {
  const blobs: TreeItem[] = [];
  for (const [path, blob] of Object.entries(files)) {
    const { sha } = await api<{ sha: string }>("/git/blobs", { method: "POST", body: JSON.stringify({ content: await blobToB64(blob), encoding: "base64" }) });
    blobs.push({ path, mode: "100644", type: "blob", sha });
  }
  for (let attempt = 0; ; attempt++) {
    const ref = await api<{ object: { sha: string } }>(`/git/ref/heads/${SITE.branch}`);
    const head = await api<{ tree: { sha: string } }>(`/git/commits/${ref.object.sha}`);
    const existing = new Set(
      (await api<{ tree: { path: string }[] }>(`/git/trees/${head.tree.sha}?recursive=1`)).tree.map((t) => t.path)
    );
    const tree: TreeItem[] = [
      { path: CONTENT_PATH, mode: "100644", type: "blob", content: JSON.stringify(content, null, 2) + "\n" },
      ...blobs,
      // 없는 파일을 지우라고 하면 깃허브가 거절하므로 있는 것만
      ...remove.filter((p) => existing.has(p)).map((path): TreeItem => ({ path, mode: "100644", type: "blob", sha: null })),
    ];
    const t = await api<{ sha: string }>("/git/trees", { method: "POST", body: JSON.stringify({ base_tree: head.tree.sha, tree }) });
    const c = await api<{ sha: string }>("/git/commits", { method: "POST", body: JSON.stringify({ message, tree: t.sha, parents: [ref.object.sha] }) });
    try {
      await api(`/git/refs/heads/${SITE.branch}`, { method: "PATCH", body: JSON.stringify({ sha: c.sha }) });
      return c.sha;
    } catch (e) {
      if (attempt === 0 && (e as { status?: number }).status === 422) continue;
      throw e;
    }
  }
}
