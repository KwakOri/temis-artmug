// 공통 편집기(/edit): 칸 목록(schema)을 읽어 칸을 그려 고치고, 깃허브 저장소의 content.json(+새 사진)으로 저장한다.
// 저장하면 GitHub Actions가 다시 배포해 1~2분 뒤 상세페이지에 적용된다.
// 오른쪽 미리보기는 ./?draft&edit(localStorage의 고치는 중인 내용)를 띄운다.
// 미리보기의 글자를 누르면 그 자리 팝오버(폰은 아래 시트)에서 원문을 고치고, 사진은 사진 바꾸기, 금액·목록은 왼쪽 칸 목록의 그 줄로 옮겨 간다(page.ts).
// 손님마다 다른 것은 schema뿐이다. 여기에 손님 이름·칸 이름을 적지 않는다.
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, ListTree, MousePointerClick, Plus, Settings, Trash2 } from "lucide-react";
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { DRAFT_KEY, PENDING_KEY, fetchPublished, merge, readDraft } from "./content";
import { forgetToken, getToken, repoOf } from "./github";
import { SIZES, makePhoto, toDataUrl } from "./image";
import { EDIT_MSG, type FromPage, type PageCmd, type Rect } from "./page";
import {
  choicesOf,
  describe,
  getIn,
  hintsFor,
  isHidden,
  isObj,
  keyOf,
  kindOf,
  labelOf,
  missingPhoto,
  nameOf,
  parsePath,
  photoOf,
  photosIn,
  setIn,
  type Json,
  type Path,
  type Schema,
} from "./schema";

type Doc = Record<string, Json>;

/** 아직 저장 안 한 새 사진: src → 두 벌 + 썸네일 주소 */
type Pending = Record<string, { s: Blob; l: Blob; url: string }>;
const Ctx = createContext<{ schema: Schema<any>; pending: Pending; pick: (path: Path, file: File) => void }>(null!);

const thumbOf = (schema: Schema<any>, pending: Pending, path: Path, src: string) => pending[src]?.url ?? (src ? `./${photoOf(schema, path)!.dir}/${src}-s.webp` : "");

function Photo({ path, src }: { path: Path; src: string }) {
  const { schema, pending, pick } = useContext(Ctx);
  const ref = useRef<HTMLInputElement>(null);
  const url = thumbOf(schema, pending, path, src);
  return (
    <div data-path={path.join(".")} className="flex items-center gap-3">
      {url ? <img src={url} alt="" className="h-16 w-28 rounded-md bg-white object-cover" /> : <div className="grid h-16 w-28 place-items-center rounded-md bg-white text-[12px] text-red-500">사진 없음</div>}
      <button type="button" onClick={() => ref.current?.click()} className="flex items-center gap-1 rounded-full border border-ed-ink/20 bg-white px-3 py-1.5 text-[13px] font-bold">
        <ImagePlus size={15} /> {src ? "사진 바꾸기" : "사진 고르기"}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pick(path, f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** 새 항목: 마지막 항목 모양을 빈 값으로. id는 겹치지 않게 새로 만든다. */
function blank(v: Json): Json {
  if (typeof v === "string") return "";
  if (typeof v === "number") return 0;
  if (typeof v === "boolean") return false;
  if (Array.isArray(v)) return [];
  if (isObj(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === "id" ? `new-${Date.now().toString(36)}` : k === "kind" || k === "type" ? x : blank(x)]));
  return v;
}

const input = "w-full rounded-lg border border-ed-line bg-white px-3 py-2 text-sm text-ed-ink focus:outline-ed-accent";

function Field({ name, path, value, onChange }: { name: string; path: Path; value: Json; onChange: (p: Path, v: Json) => void }) {
  const { schema } = useContext(Ctx);
  const k = keyOf(path);
  if (isHidden(schema, path)) return null;
  if (photoOf(schema, path) && typeof value === "string") return <Photo path={path} src={value} />;
  const label = labelOf(schema, name, k);
  const dp = path.join(".");
  const choices = choicesOf(schema, name, k);

  if (choices && typeof value === "string")
    return (
      <label data-path={dp} className="block">
        <span className="text-[13px] font-semibold text-ed-ink/70">{label}</span>
        <select className={input} value={value} onChange={(e) => onChange(path, e.target.value)}>
          {choices.map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
      </label>
    );
  if (typeof value === "boolean")
    return (
      <label data-path={dp} className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value} onChange={(e) => onChange(path, e.target.checked)} className="accent-ed-accent size-4" />
        {label}
      </label>
    );
  if (typeof value === "number")
    return (
      <label data-path={dp} className="block">
        <span className="text-[13px] font-semibold text-ed-ink/70">{label}</span>
        <input type="number" className={input} value={value} onChange={(e) => onChange(path, e.target.value === "" ? 0 : Number(e.target.value))} />
      </label>
    );
  if (typeof value === "string") {
    const long = value.includes("\n") || value.length > 40 || (schema.longText ?? []).includes(name);
    return (
      <label data-path={dp} className="block">
        <span className="text-[13px] font-semibold text-ed-ink/70">{label}</span>
        {long ? (
          <textarea className={input} rows={Math.max(2, value.split("\n").length + 1)} value={value} onChange={(e) => onChange(path, e.target.value)} />
        ) : (
          <input className={input} value={value} onChange={(e) => onChange(path, e.target.value)} />
        )}
      </label>
    );
  }
  if (Array.isArray(value)) {
    const fixed = (schema.fixedLists ?? []).includes(k);
    const titleKeys = schema.itemTitle ?? ["name", "title", "label", "quote"];
    const move = (i: number, d: number) => {
      const next = [...value];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      onChange(path, next);
    };
    return (
      <fieldset data-path={dp} className="rounded-xl border border-ed-line p-3 space-y-2">
        <legend className="px-1 text-[13px] font-bold text-ed-ink">{label}</legend>
        {value.map((item, i) => (
          <div key={i} data-path={`${dp}.${i}`} className={isObj(item) ? "rounded-lg bg-ed-soft p-3 space-y-2" : "flex items-start gap-1"}>
            <div className={isObj(item) ? "flex items-center gap-1" : "contents"}>
              {isObj(item) && (
                <span className="flex-1 text-[13px] font-bold text-ed-accent">
                  {i + 1}. {String(titleKeys.map((t) => item[t]).find((t) => t != null) ?? "").slice(0, 30)}
                </span>
              )}
              {!isObj(item) && (
                <div className="flex-1">
                  <Field name="" path={[...path, i]} value={item} onChange={onChange} />
                </div>
              )}
              <button type="button" title="위로" disabled={i === 0} onClick={() => move(i, -1)} className="p-1.5 text-ed-ink/50 disabled:opacity-20">
                <ArrowUp size={16} />
              </button>
              <button type="button" title="아래로" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="p-1.5 text-ed-ink/50 disabled:opacity-20">
                <ArrowDown size={16} />
              </button>
              {!fixed && (
                <button type="button" title="빼기" onClick={() => confirm("이 항목을 뺄까요?") && onChange(path, value.filter((_, j) => j !== i))} className="p-1.5 text-red-500/70">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            {isObj(item) && Object.entries(item).map(([n, v]) => <Field key={n} name={n} path={[...path, i, n]} value={v} onChange={onChange} />)}
          </div>
        ))}
        {!fixed && value.length > 0 && (
          <button type="button" onClick={() => onChange(path, [...value, blank(value[value.length - 1])])} className="flex items-center gap-1 text-[13px] font-bold text-ed-accent">
            <Plus size={16} /> 추가
          </button>
        )}
      </fieldset>
    );
  }
  if (isObj(value)) {
    const body = Object.entries(value).map(([n, v]) => <Field key={n} name={n} path={[...path, n]} value={v} onChange={onChange} />);
    return path.length === 1 ? (
      <>{body}</>
    ) : (
      <fieldset data-path={dp} className="rounded-xl border border-ed-line p-3 space-y-2">
        <legend className="px-1 text-[13px] font-bold text-ed-ink">{label}</legend>
        {body}
      </fieldset>
    );
  }
  return null;
}

type Sel = { path: Path; rect: Rect; orig: Json };

/** 미리보기에서 누른 글자·사진을 고치는 창. PC는 누른 자리 옆 팝오버, 폰(sheet)은 아래에서 올라오는 시트.
 *  고치는 대로 미리보기에 바로 보이고, 「취소」는 열기 전 값으로 되돌린다. 저장(커밋)은 위의 「저장」에서 한 번에. */
function InlineEdit({
  sel,
  doc,
  frame,
  sheet,
  onEdit,
  onClose,
  onPanel,
  onSheetHeight,
}: {
  sel: Sel;
  doc: Doc;
  frame: HTMLIFrameElement | null;
  sheet: boolean;
  onEdit: (p: Path, v: Json) => void;
  onClose: () => void;
  onPanel: (p: Path) => void;
  onSheetHeight: (h: number) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const photoIn = useRef<HTMLInputElement>(null);
  const { schema, pending, pick } = useContext(Ctx);
  const [h, setH] = useState(220);
  const [kb, setKb] = useState(0);
  const value = getIn(doc, sel.path);
  const photo = kindOf(schema, sel.path, value) === "photo";
  const cancel = () => {
    onEdit(sel.path, sel.orig);
    onClose();
  };

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setH(el.offsetHeight);
      if (sheet) onSheetHeight(el.offsetHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [sheet]);

  // 새 칸을 누르면 입력창으로 바로(PC만. 폰은 키보드가 미리보기를 가려서 직접 누르게 둔다)
  useEffect(() => {
    if (!sheet) field.current?.focus({ preventScroll: true });
  }, [sel.path.join("."), sheet]);

  // 아이폰: 키보드가 올라와도 시트가 키보드 위에 붙어 있게
  useEffect(() => {
    const vv = window.visualViewport;
    if (!sheet || !vv) return;
    const fit = () => setKb(Math.max(0, innerHeight - vv.height - vv.offsetTop));
    vv.addEventListener("resize", fit);
    vv.addEventListener("scroll", fit);
    fit();
    return () => {
      vv.removeEventListener("resize", fit);
      vv.removeEventListener("scroll", fit);
    };
  }, [sheet]);

  let style: CSSProperties;
  if (sheet) style = { bottom: kb };
  else {
    const f = frame?.getBoundingClientRect() ?? { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    const w = Math.min(460, Math.max(320, sel.rect.w + 24), f.right - f.left - 16);
    const left = Math.min(Math.max(f.left + sel.rect.x - 12, f.left + 8), f.right - w - 8);
    const below = f.top + sel.rect.y + sel.rect.h + 10;
    const above = f.top + sel.rect.y - h - 10;
    const top = below + h <= innerHeight - 8 || above < f.top + 8 ? Math.min(below, innerHeight - h - 8) : above;
    style = { left, top: Math.max(8, top), width: w };
  }

  const hints = hintsFor(schema, sel.path, doc);
  const text = typeof value === "string" ? value : "";
  const src = photo ? text : "";
  const thumb = photo ? thumbOf(schema, pending, sel.path, src) : "";

  return (
    <div
      ref={box}
      role="dialog"
      aria-label={describe(schema, sel.path)}
      style={style}
      onKeyDown={(e) => {
        if (e.key === "Escape") cancel();
        else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onClose();
      }}
      className={
        sheet
          ? "fixed inset-x-0 z-30 rounded-t-2xl border-t border-[#2f6bff]/30 bg-white px-4 pt-2 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(27,22,18,0.18)]"
          : "fixed z-30 rounded-2xl border-2 border-[#2f6bff] bg-white p-3 shadow-[0_10px_30px_rgba(27,22,18,0.2)]"
      }
    >
      {sheet && <div aria-hidden className="mx-auto mb-2 h-1 w-10 rounded-full bg-ed-ink/15" />}
      <div className="flex items-center gap-2">
        <b className="flex-1 truncate text-[12.5px] text-[#2f6bff]">{describe(schema, sel.path)}</b>
        <button type="button" onClick={() => onPanel(sel.path)} className="flex shrink-0 items-center gap-1 text-[12px] text-ed-ink/50 hover:text-ed-ink">
          <ListTree size={14} /> 칸 목록에서 보기
        </button>
      </div>
      {photo ? (
        <div className="mt-2 flex items-center gap-3">
          {thumb ? <img src={thumb} alt="" className="h-16 w-28 rounded-md bg-ed-soft object-cover" /> : <div className="grid h-16 w-28 place-items-center rounded-md bg-ed-soft text-[12px] text-red-500">사진 없음</div>}
          <button type="button" onClick={() => photoIn.current?.click()} className="flex items-center gap-1 rounded-full bg-[#2f6bff] px-3.5 py-2 text-[13px] font-bold text-white">
            <ImagePlus size={15} /> 사진 바꾸기
          </button>
          <input
            ref={photoIn}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pick(sel.path, f);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <textarea
          ref={field}
          value={text}
          rows={Math.min(8, Math.max(2, text.split("\n").length + (text.length > 40 ? 1 : 0)))}
          onChange={(e) => onEdit(sel.path, e.target.value)}
          className={`${input} mt-2 leading-relaxed ${sheet ? "text-base" : ""}`}
        />
      )}
      {hints.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 text-[12px] leading-snug text-ed-ink/55">
          {hints.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
      <div className={`mt-2.5 flex gap-2 ${sheet ? "" : "justify-end"}`}>
        <button type="button" onClick={cancel} className={`h-9 rounded-full bg-ed-soft px-4 text-[13px] font-bold ${sheet ? "h-11 flex-1" : ""}`}>
          취소
        </button>
        <button type="button" onClick={onClose} className={`h-9 rounded-full bg-[#2f6bff] px-4 text-[13px] font-bold text-white ${sheet ? "h-11 flex-1" : ""}`}>
          적용
        </button>
      </div>
    </div>
  );
}

/** 목록 탭 위: 사진 여러 장을 한꺼번에 항목으로 붙인다(schema.bulk). */
function BulkPhotos({ busy, onPick }: { busy: boolean; onPick: (files: File[], chosen: string) => void }) {
  const { schema } = useContext(Ctx);
  const bulk = schema.bulk!;
  const [chosen, setChosen] = useState(bulk.choose?.default ?? "");
  const choices = bulk.choose && choicesOf(schema, bulk.choose.field, `${bulk.list}.${bulk.choose.field}`);
  return (
    <div className="rounded-xl border border-dashed border-ed-accent/60 bg-white p-3 space-y-2">
      <p className="text-[13px] font-bold text-ed-ink">{bulk.title}</p>
      <div className="flex items-center gap-2">
        {bulk.choose && choices && (
          <select aria-label={labelOf(schema, bulk.choose.field, `${bulk.list}.${bulk.choose.field}`)} className={`${input} max-w-[7.5rem] shrink-0`} value={chosen} onChange={(e) => setChosen(e.target.value)}>
            {choices.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        )}
        <label className={`flex-1 cursor-pointer whitespace-nowrap rounded-lg bg-ed-accent px-3 py-2 text-center text-sm font-bold text-white ${busy ? "pointer-events-none opacity-50" : ""}`}>
          사진 고르기(여러 장)
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              const files = [...(e.target.files ?? [])];
              e.target.value = "";
              if (files.length) onPick(files, chosen);
            }}
          />
        </label>
      </div>
      {bulk.note && <p className="text-[12px] leading-relaxed text-ed-ink/50">{bulk.note}</p>}
    </div>
  );
}

export default function Editor({ schema }: { schema: Schema<any> }) {
  // 디자인 기본값과 저장소. schema는 한 번 받으면 바뀌지 않는다.
  const { DEFAULT_DOC, SECTIONS, KEEP, repo } = useMemo(() => {
    const DEFAULT_DOC = structuredClone(schema.defaults) as Doc;
    return {
      DEFAULT_DOC,
      /** 탭: 맨 위 칸들(다른 탭에 붙는 칸 제외) */
      SECTIONS: Object.keys(DEFAULT_DOC).filter((k) => !schema.tabOf?.[k]),
      /** 저장할 때 지우지 않을 사진(기본값이 쓰는 것. 「기본값으로 되돌리기」가 다시 찾는다) */
      KEEP: new Set(photosIn(schema, DEFAULT_DOC).keys()),
      repo: repoOf(schema.site, schema.contentPath),
    };
  }, [schema]);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [saved, setSaved] = useState("");
  const [tab, setTab] = useState(SECTIONS[0]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending>({});
  const [setup, setSetup] = useState(false);
  const [token, setToken] = useState("");
  const savedDoc = (): Doc => JSON.parse(saved);
  // 미리보기 눌러 고치기
  const frame = useRef<HTMLIFrameElement>(null);
  const head = useRef<HTMLElement>(null);
  const [headH, setHeadH] = useState(52);
  const [sel, setSel] = useState<Sel | null>(null);
  const [clickEdit, setClickEdit] = useState(true);
  /** 폰(lg 미만)은 칸 목록과 미리보기를 번갈아 본다 */
  const [view, setView] = useState<"form" | "preview">("form");
  const [sheet, setSheet] = useState(() => innerWidth < 640);
  const docRef = useRef(doc);
  docRef.current = doc;
  const toPage = (m: PageCmd) => frame.current?.contentWindow?.postMessage({ type: EDIT_MSG, ...m }, location.origin);

  // 처음: 저장소의 최신 content.json(없으면 배포본, 그것도 없으면 기본값)을 불러오고, 저장 안 한 고친 내용이 있으면 이어서 할지 묻는다.
  // 고르던 사진은 브라우저를 닫으면 사라지므로, 이어서 고칠 때 사진 없는 항목은 「사진 없음」으로 보인다.
  useEffect(() => {
    localStorage.removeItem(PENDING_KEY);
    (async () => (await repo.loadContent()) ?? (await fetchPublished()))().then((pub) => {
      const base = merge(DEFAULT_DOC, pub);
      const draft = readDraft();
      const resume = draft && JSON.stringify(merge(DEFAULT_DOC, draft)) !== JSON.stringify(base) && confirm("저장하지 않은 고친 내용이 있어요. 이어서 고칠까요?");
      setSaved(JSON.stringify(base));
      setDoc(resume ? merge(DEFAULT_DOC, draft) : base);
      if (!getToken()) setSetup(true);
    });
  }, []);

  useEffect(() => {
    if (doc) localStorage.setItem(DRAFT_KEY, JSON.stringify(doc));
  }, [doc]);

  const dirty = !!doc && (JSON.stringify(doc) !== saved || Object.keys(pending).length > 0);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);

  useLayoutEffect(() => {
    const el = head.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeadH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [doc === null]);

  useEffect(() => {
    const fit = () => setSheet(innerWidth < 640);
    addEventListener("resize", fit);
    return () => removeEventListener("resize", fit);
  }, []);

  // 미리보기(page/editMode.ts)가 보내는 「이 칸을 눌렀어요」
  useEffect(() => {
    const onMsg = (e: MessageEvent<FromPage>) => {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow || e.data?.type !== EDIT_MSG || !docRef.current) return;
      const m = e.data;
      if (m.action === "move") return setSel((s) => (s ? { ...s, rect: m.rect } : s));
      const path = parsePath(m.path);
      const v = getIn(docRef.current, path);
      const kind = kindOf(schema, path, v);
      if (!kind) return;
      if (kind === "panel") {
        setSel(null);
        toPage({ action: "clear" });
        goPanel(path);
      } else setSel((s) => (s && s.path.join(".") === m.path ? { ...s, rect: m.rect } : { path, rect: m.rect, orig: v }));
    };
    addEventListener("message", onMsg);
    return () => removeEventListener("message", onMsg);
  }, []);

  const closeSel = () => {
    setSel(null);
    toPage({ action: "clear" });
  };

  /** 왼쪽 칸 목록에서 그 탭·줄로 옮겨 가 잠깐 빛나게 한다(금액·종류·목록·순서는 여기서만 고친다) */
  const goPanel = (path: Path) => {
    setSel(null);
    toPage({ action: "clear" });
    setTab(schema.tabOf?.[path[0] as string] ?? (path[0] as string));
    setView("form");
    setTimeout(() => {
      for (let n = path.length; n > 0; n--) {
        const el = document.querySelector<HTMLElement>(`[data-path="${CSS.escape(path.slice(0, n).join("."))}"]`);
        if (!el) continue;
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        el.classList.remove("edit-flash");
        void el.offsetWidth;
        el.classList.add("edit-flash");
        setTimeout(() => el.classList.remove("edit-flash"), 1900);
        if (innerWidth >= 1024) el.querySelector<HTMLElement>("input:not([type=file]),select,textarea")?.focus({ preventScroll: true });
        break;
      }
    }, 80);
  };

  const run = async (label: string, job: () => Promise<string | void>) => {
    setBusy(true);
    setMsg(`${label} 중…`);
    try {
      setMsg((await job()) || `${label} 끝`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const edit = (p: Path, v: Json) => setDoc((d) => setIn(d, p, v) as Doc);

  // 사진 고르기: 줄여서 새 이름(src)으로 들고 있다가 저장 때 같이 올린다. 미리보기용 작은 사진은 localStorage에도 둔다.
  const shrink = async (file: File, path: Path, n = 0) => {
    const { s, l } = await makePhoto(file, photoOf(schema, path)?.sizes ?? SIZES);
    const src = `w-${Date.now().toString(36)}${n ? `-${n}` : ""}`;
    setPending((p) => ({ ...p, [src]: { s, l, url: URL.createObjectURL(s) } }));
    try {
      const prev = JSON.parse(localStorage.getItem(PENDING_KEY) ?? "{}");
      // 확대(l)도 작은 사진으로 보여 준다. 미리보기용이라 브라우저 저장 공간을 아낀다.
      const small = await toDataUrl(s);
      localStorage.setItem(PENDING_KEY, JSON.stringify({ ...prev, [src]: { s: small, l: small } }));
    } catch {
      // 브라우저 저장 공간이 차면 미리보기에서만 사진이 안 보인다. 저장은 된다.
    }
    return { src, s, l };
  };
  const pick = (path: Path, file: File) =>
    run("사진 줄이기", async () => {
      const { src, s, l } = await shrink(file, path);
      edit(path, src);
      return `사진을 줄였어요(${Math.round(s.size / 1024)}KB · ${Math.round(l.size / 1024)}KB). 저장하면 올라가요.`;
    });
  // 사진 여러 장 한꺼번에(schema.bulk): 고른 순서대로 목록 끝에 붙인다. 선택 칸은 한 번에 고르고, 나머지 글자는 비워 둔다.
  const pickMany = (files: File[], chosen: string) =>
    run("사진 여러 장 줄이기", async () => {
      const bulk = schema.bulk!;
      const listPath = parsePath(bulk.list);
      const list = (getIn(doc, listPath) as Json[] | undefined) ?? [];
      const like = list[list.length - 1] ?? (getIn(DEFAULT_DOC, listPath) as Json[] | undefined)?.[0] ?? {};
      const added: Json[] = [];
      for (const [i, f] of files.entries()) {
        setMsg(`사진 줄이는 중… ${i + 1} / ${files.length}`);
        const { src } = await shrink(f, [...listPath, list.length + i, bulk.photo], i + 1);
        added.push({ ...(blank(like) as object), [bulk.photo]: src, ...(bulk.choose ? { [bulk.choose.field]: chosen } : {}) });
      }
      setDoc((d) => d && (setIn(d, listPath, [...((getIn(d, listPath) as Json[] | undefined) ?? []), ...added]) as Doc));
      return `${labelOf(schema, nameOf(listPath.slice(0, -1)) || bulk.list, keyOf(listPath.slice(0, -1)))} ${added.length}개를 목록 끝에 붙였어요. 저장하면 한 번에 올라가요.`;
    });

  const saveToken = () =>
    run("깃허브 연결", async () => {
      await repo.connect(token.trim());
      setToken("");
      setSetup(false);
      return "깃허브에 연결했어요. 이제 「저장」을 누르면 상세페이지에 반영돼요.";
    });

  // 배포가 끝났는지 content.json의 updatedAt으로 확인한다(보통 1~2분).
  const watch = (stamp: string) => {
    const started = Date.now();
    const tick = async () => {
      const pub = await fetchPublished();
      if (pub?.updatedAt === stamp) return setMsg(`상세페이지에 적용됐어요 (${new Date().toLocaleTimeString("ko-KR")}). 아트머그에 넣은 페이지도 새로고침하면 바뀌어 있어요.`);
      if (Date.now() - started > 6 * 60_000) return setMsg("저장은 됐는데 6분이 지나도 적용이 안 보여요. 깃허브 저장소의 Actions 탭에서 배포가 실패했는지 확인해 주세요.");
      setTimeout(tick, 10_000);
    };
    setTimeout(tick, 20_000);
  };

  const doSave = () => {
    if (!getToken()) return setSetup(true);
    const hole = missingPhoto(schema, doc);
    if (hole) return setMsg(photoOf(schema, hole)?.missing ?? `사진이 빠진 칸이 있어요(${describe(schema, hole)}). 사진을 고르거나 그 항목을 빼 주세요.`);
    run("저장", async () => {
      const now = photosIn(schema, doc!);
      const files: Record<string, Blob> = {};
      for (const [src, p] of Object.entries(pending)) {
        const spec = now.get(src);
        if (spec) {
          files[`public/${spec.dir}/${src}-s.webp`] = p.s;
          files[`public/${spec.dir}/${src}-l.webp`] = p.l;
        }
      }
      const gone = [...photosIn(schema, savedDoc())]
        .filter(([src]) => !now.has(src) && !KEEP.has(src))
        .flatMap(([src, spec]) => [`public/${spec.dir}/${src}-s.webp`, `public/${spec.dir}/${src}-l.webp`]);
      const changed = SECTIONS.filter((k) => JSON.stringify(doc![k]) !== JSON.stringify(savedDoc()[k])).map((k) => labelOf(schema, k, k));
      const updatedAt = new Date().toISOString();
      await repo.commit({ ...doc, updatedAt }, files, gone, `편집기 저장: ${changed.join(", ") || "사진"}`);
      setSaved(JSON.stringify(doc));
      setPending({});
      localStorage.removeItem(PENDING_KEY);
      watch(updatedAt);
      return "저장했어요. 1~2분 뒤 상세페이지에 적용돼요. 적용되면 여기서 알려 드릴게요.";
    });
  };

  const reset = () => {
    if (confirm("이 칸들을 처음 기본값으로 되돌릴까요? 저장해야 반영돼요.")) setDoc({ ...doc!, [tab]: structuredClone(DEFAULT_DOC[tab]) });
  };

  if (!doc) return <p className="p-6 text-ed-ink/60">불러오는 중…</p>;

  return (
    <div className="min-h-screen text-ed-ink">
      <header ref={head} className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-ed-line bg-ed-soft/95 px-4 py-2 backdrop-blur">
        {schema.logo}
        <span className="text-sm font-bold">{schema.title?.(doc) ?? "상세페이지 고치기"}</span>
        <span className="flex-1" />
        <span className="text-[13px] text-ed-ink/60">{dirty ? "● 저장 안 됨" : "저장됨"}</span>
        <button type="button" title="깃허브 연결" onClick={() => setSetup((v) => !v)} className="grid size-9 place-items-center rounded-full border border-ed-ink/20 bg-white">
          <Settings size={16} />
        </button>
        <button type="button" disabled={busy || !dirty} onClick={doSave} className="h-9 rounded-full bg-ed-accent px-5 text-sm font-bold text-white disabled:opacity-40">
          저장
        </button>
        <a href="./" target="_blank" className="flex items-center gap-1 text-[13px] text-ed-ink/60">
          상세페이지 <ExternalLink size={14} />
        </a>
        <div className="flex w-full gap-1 lg:hidden">
          {(
            [
              ["form", "칸 목록"],
              ["preview", "미리보기에서 고치기"],
            ] as const
          ).map(([v, t]) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setView(v);
                if (v === "form") closeSel();
              }}
              className={`h-8 flex-1 rounded-full text-[13px] font-bold ${view === v ? "bg-ed-ink text-white" : "bg-white text-ed-ink/60"}`}
            >
              {t}
            </button>
          ))}
        </div>
        {msg && <p className="w-full select-all text-[13px] text-ed-ink/80">{msg}</p>}
        {setup && (
          <div className="w-full space-y-2 rounded-xl bg-white p-4 text-[13px] leading-relaxed">
            <b className="text-sm">깃허브 연결 {getToken() ? "(연결됨)" : ""}</b>
            <p>저장하려면 깃허브 토큰이 한 번 필요해요. 토큰은 이 브라우저에만 저장되고 깃허브 말고는 아무 데도 보내지 않아요.</p>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>
                깃허브에 로그인한 뒤{" "}
                <a className="text-ed-accent underline" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">
                  새 토큰 만들기
                </a>
                를 열어요.
              </li>
              <li>Expiration: 원하는 기한(지나면 여기서 다시 넣으면 돼요)</li>
              <li>
                Repository access: <b>Only select repositories</b> → <code>{schema.site.repo}</code>
              </li>
              <li>
                Permissions → Repository permissions → <b>Contents: Read and write</b>
              </li>
              <li>만든 토큰(github_pat_…)을 아래에 붙여 넣어요.</li>
            </ol>
            <div className="flex flex-wrap gap-2">
              <input type="password" autoComplete="off" placeholder="github_pat_…" value={token} onChange={(e) => setToken(e.target.value)} className={`${input} max-w-sm flex-1`} />
              <button type="button" disabled={busy || !token.trim()} onClick={saveToken} className="h-9 rounded-full bg-ed-ink px-4 text-sm font-bold text-white disabled:opacity-40">
                확인하고 연결
              </button>
              {getToken() && (
                <button
                  type="button"
                  onClick={() => {
                    forgetToken();
                    setMsg("이 브라우저에서 토큰을 지웠어요.");
                  }}
                  className="h-9 px-2 text-sm text-red-500"
                >
                  토큰 지우기
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(380px,520px)_1fr]">
        <main className={`space-y-3 p-4 ${view === "preview" ? "hidden lg:block" : ""}`}>
          <nav className="flex flex-wrap gap-1">
            {SECTIONS.map((s) => (
              <button key={s} type="button" onClick={() => setTab(s)} className={`rounded-full px-3 py-1 text-[13px] font-semibold ${tab === s ? "bg-ed-ink text-white" : "bg-white text-ed-ink/70"}`}>
                {labelOf(schema, s, s)}
              </button>
            ))}
          </nav>
          <Ctx.Provider value={{ schema, pending, pick }}>
            {Object.entries(schema.tabOf ?? {})
              .filter(([, t]) => t === tab)
              .map(([k]) => (
                <Field key={k} name={k} path={[k]} value={doc[k]} onChange={edit} />
              ))}
            {schema.bulk && parsePath(schema.bulk.list)[0] === tab && <BulkPhotos busy={busy} onPick={pickMany} />}
            <Field name={tab} path={[tab]} value={doc[tab]} onChange={edit} />
          </Ctx.Provider>
          <button type="button" onClick={reset} className="text-[12px] text-ed-ink/50 underline">
            이 탭을 기본값으로 되돌리기
          </button>
          {schema.panelNote && <p className="text-[12px] leading-relaxed text-ed-ink/50">{schema.panelNote}</p>}
        </main>
        <aside
          style={{ top: headH, height: `calc(100dvh - ${headH}px)` }}
          className={`sticky flex-col border-l border-ed-line ${view === "preview" ? "flex" : "hidden lg:flex"}`}
        >
          <div className="flex items-center gap-2 border-b border-ed-line bg-white px-3 py-1.5 text-[12.5px]">
            <MousePointerClick size={15} className={clickEdit ? "text-[#2f6bff]" : "text-ed-ink/40"} />
            <span className="flex-1 text-ed-ink/70">{clickEdit ? "점선 글자를 누르면 바로 고쳐요. 사진·금액·목록은 칸 목록으로 옮겨 가요." : "미리보기를 손님처럼 눌러 볼 수 있어요."}</span>
            <label className="flex shrink-0 items-center gap-1.5 font-bold">
              <input
                type="checkbox"
                checked={clickEdit}
                onChange={(e) => {
                  setClickEdit(e.target.checked);
                  if (!e.target.checked) setSel(null);
                  toPage({ action: "mode", on: e.target.checked });
                }}
                className="accent-[#2f6bff] size-4"
              />
              눌러 고치기
            </label>
          </div>
          <iframe ref={frame} src="./?draft&edit" title="미리보기" onLoad={() => toPage({ action: "mode", on: clickEdit })} className="w-full flex-1 bg-white" />
        </aside>
      </div>
      {sel && (
        <Ctx.Provider value={{ schema, pending, pick }}>
          <InlineEdit
            sel={sel}
            doc={doc}
            frame={frame.current}
            sheet={sheet}
            onEdit={edit}
            onClose={closeSel}
            onPanel={goPanel}
            onSheetHeight={(h) => {
              const f = frame.current?.getBoundingClientRect();
              toPage({ action: "reveal", bottom: Math.max(0, h - (f ? innerHeight - f.bottom : 0)) });
            }}
          />
        </Ctx.Provider>
      )}
    </div>
  );
}
