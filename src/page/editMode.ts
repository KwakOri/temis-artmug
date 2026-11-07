// /edit 미리보기의 「눌러 고치기」(?draft&edit).
// data-edit="works.items.2.title"처럼 content.json 경로가 붙은 글자·사진을 누르면, 페이지 동작(확대·옵션 고르기 등) 대신
// 부모 창(/edit)에 경로와 위치를 알린다. 고치는 입력창은 편집기가 띄운다.
// 화면 글자를 직접 고치지 않는다(contenteditable 금지): *강조*·줄바꿈·{숫자} 치환이 있어 원문을 입력창에서 고쳐야 깨지지 않는다.

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

/** 눌러 고치기를 켠다. 돌려주는 함수는 다시 그린 뒤 부른다(고른 칸 위치를 편집기에 다시 알림). */
export function startEditMode() {
  const root = document.documentElement;
  let on = false;
  let active: HTMLElement | null = null;
  let path = "";
  const post = (m: PageMsg) => parent.postMessage({ type: EDIT_MSG, ...m }, location.origin);

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
      const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-edit]");
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
  return move;
}
