// 손님 화면 쪽 엔진: 게시된 content.json(또는 /edit이 고치는 중인 내용)을 기본값 위에 덮고 다시 그린다.
// /edit 미리보기(?draft&edit)에서는 「눌러 고치기」를 켠다.
//
// 디자인은 고칠 수 있는 글자·사진에 data-edit="<전체 경로>"만 붙인다(예: data-edit="works.items.2.title").
// 어느 것에 점선을 붙이고 누르면 무엇을 할지는 칸 목록(schema)을 보고 엔진이 정한다(data-edit-kind).
// 화면 글자를 직접 고치지 않는다(contenteditable 금지): *강조*·줄바꿈·{숫자} 치환이 있어 원문을 입력창에서 고쳐야 깨지지 않는다.
import { IS_DRAFT, fetchPublished, merge, readDraft } from "./content";
import { getIn, kindOf, parsePath, type Schema } from "./schema";

export const EDIT_MSG = "artmug-edit";

export type Rect = { x: number; y: number; w: number; h: number };
/** 미리보기 → 편집기 */
type PageMsg = { action: "pick"; path: string; rect: Rect } | { action: "move"; rect: Rect };
export type FromPage = PageMsg & { type: typeof EDIT_MSG };
/** 편집기 → 미리보기 */
export type PageCmd = { action: "mode"; on: boolean } | { action: "clear" } | { action: "reveal"; bottom: number };
type ToPage = PageCmd & { type: typeof EDIT_MSG };

const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
};

/** 눌러 고치기를 켠다. 돌려주는 함수는 다시 그린 뒤 부른다(점선 대상을 다시 고르고, 고른 칸 위치를 편집기에 다시 알림). */
function startEditMode(schema: Schema<any>, doc: object) {
  const root = document.documentElement;
  let on = false;
  let active: HTMLElement | null = null;
  let path = "";
  const post = (m: PageMsg) => parent.postMessage({ type: EDIT_MSG, ...m }, location.origin);

  // 칸 목록에 있는(숨기지 않은) 경로에만 점선을 붙인다
  const tag = () => {
    for (const el of document.querySelectorAll<HTMLElement>("[data-edit]")) {
      const p = el.dataset.edit!;
      const kind = kindOf(schema, parsePath(p), getIn(doc, parsePath(p)));
      if (kind) el.dataset.editKind = kind;
      else delete el.dataset.editKind;
    }
  };
  let tagRaf = 0;
  new MutationObserver(() => {
    if (!tagRaf) tagRaf = requestAnimationFrame(() => ((tagRaf = 0), tag()));
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-edit"] });

  const clear = () => {
    active?.classList.remove("edit-on");
    active = null;
    path = "";
  };
  const setOn = (v: boolean) => {
    on = v;
    root.classList.toggle("edit-mode", v);
    if (!v) clear();
  };

  addEventListener(
    "click",
    (e) => {
      if (!on) return;
      const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-edit-kind]");
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      clear();
      active = el;
      path = el.dataset.edit!;
      el.classList.add("edit-on");
      post({ action: "pick", path, rect: rectOf(el) });
    },
    true
  );

  // 고른 칸이 움직이면(스크롤·다시 그림) 편집기 팝오버가 따라가게 위치를 다시 보낸다.
  // 다시 그리면서 요소가 바뀌었으면 같은 경로의 첫 요소를 다시 찾는다.
  let raf = 0;
  const move = () => {
    if (!path || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!path) return;
      if (!active?.isConnected) active = document.querySelector<HTMLElement>(`[data-edit="${CSS.escape(path)}"]`);
      if (!active) return;
      active.classList.add("edit-on");
      post({ action: "move", rect: rectOf(active) });
    });
  };
  addEventListener("scroll", move, { passive: true, capture: true });
  addEventListener("resize", move);

  addEventListener("message", (e: MessageEvent<ToPage>) => {
    if (e.origin !== location.origin || e.source !== parent || e.data?.type !== EDIT_MSG) return;
    const m = e.data;
    if (m.action === "mode") setOn(m.on);
    else if (m.action === "clear") clear();
    else if (m.action === "reveal" && active) {
      // 폰: 아래 시트가 가리는 만큼 고른 칸을 위로 올린다
      const r = active.getBoundingClientRect();
      const room = innerHeight - m.bottom;
      if (r.bottom > room - 12 || r.top < 60) scrollBy({ top: r.top - Math.max(64, (room - r.height) / 2), behavior: "smooth" });
    }
  });

  setOn(true);
  return () => {
    tag();
    move();
  };
}

/**
 * 손님 화면을 띄운다. schema.defaults(디자인이 읽는 doc 객체)에 내용을 덮어쓰고 render()를 부른다.
 * - 보통: 배포된 content.json
 * - ?draft : /edit이 고치는 중인 내용(localStorage). 바뀔 때마다 다시 그린다.
 * - ?draft&edit : 거기에 「눌러 고치기」
 */
export function startPage(schema: Schema<any>, render: () => void) {
  const doc = schema.defaults as Record<string, unknown>;
  const base = structuredClone(doc);
  const apply = (next: unknown) => Object.assign(doc, merge(base, next));

  if (!IS_DRAFT) {
    fetchPublished().then((saved) => {
      if (saved) apply(saved);
      render();
    });
    return;
  }
  const moved = /[?&]edit\b/.test(location.search) && parent !== window ? startEditMode(schema, doc) : null;
  apply(readDraft());
  render();
  addEventListener("storage", () => {
    apply(readDraft());
    render();
    if (moved) setTimeout(moved, 30);
  });
}
