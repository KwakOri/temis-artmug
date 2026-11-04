// 주인용 편집기: data.ts 모양 그대로 칸을 그려 고치고, 구글 드라이브의 JSON 한 개로 저장한다.
// 오른쪽 미리보기는 ./?draft(localStorage의 고치는 중인 내용)를 띄운다.
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Doc } from "../page/data";
import { DEFAULT_DOC, DRAFT_KEY, REMOTE, fetchPublished, fileId, merge, readDraft } from "../page/remote";
import { loadSaved, save, signIn, signedIn } from "./google";

type Path = (string | number)[];
type Json = unknown;

/** 칸 이름 */
const LABEL: Record<string, string> = {
  brand: "브랜드 이름",
  hero: "첫 화면",
  strip: "맨 위 검은 띠 문구",
  benefits: "이런 점이 좋아요",
  icon: "아이콘",
  title: "제목",
  body: "본문",
  sub: "설명",
  works: "작업물",
  items: "항목",
  cat: "구성",
  demo: "체험존",
  reviews: "후기",
  quote: "한 줄 인용",
  pricing: "가격",
  plans: "구성",
  name: "이름",
  price: "가격(원)",
  desc: "설명",
  points: "특징",
  badge: "배지",
  options: "옵션",
  kind: "가격 방식",
  value: "값 (정액이면 원, 비율이면 %)",
  revisions: "기본 수정 횟수",
  omakaseRevisions: "오마카세 수정 횟수",
  period: "작업 기간",
  slots: "작업 자리",
  csvUrl: "구글 시트 「공개」 탭 CSV 주소",
  note: "안내 문구",
  process: "진행 순서",
  notice: "주의사항",
  must: "필독 표시(처음부터 펼침)",
  form: "신청 양식",
  fields: "칸",
  label: "칸 이름",
  type: "칸 종류",
  required: "필수",
  placeholder: "예시 문구",
  showIf: "보이는 조건",
  attachNote: "첨부 안내",
};

const CHOICES: Record<string, [string, string][]> = {
  kind: [["fixed", "정액(음수면 할인)"], ["percent", "고른 구성 가격의 %"], ["ask", "별도 문의"]],
  cat: [["structured", "정형"], ["unstructured", "비정형"], ["team", "팀"]],
  icon: [["pencil", "연필"], ["phone", "폰"], ["users", "사람들"], ["heart", "하트"]],
  type: [["text", "한 줄"], ["longtext", "여러 줄"], ["number", "숫자"], ["date", "날짜"]],
  showIf: [["", "늘"], ["omakaseOff", "오마카세가 아닐 때만"], ["team", "팀 시간표일 때만"]],
};

/** 지금 페이지에 안 쓰이거나 코드가 쓰는 값이라 숨기는 칸 */
const HIDDEN = new Set(["id", "src", "conflicts", "hero.title", "hero.sub", "hero.tags"]);
/** 항목을 늘리거나 줄이면 안 되는 목록(구성 3개는 코드가 id로 찾고, 작업물 그림은 저장소에 있다) */
const FIXED_LIST = new Set(["pricing.plans", "works.items"]);

const key = (p: Path) => p.filter((x) => typeof x === "string").join(".");
const isObj = (v: Json): v is Record<string, Json> => !!v && typeof v === "object" && !Array.isArray(v);

function setIn(root: Json, path: Path, v: Json): Json {
  if (!path.length) return v;
  const [h, ...rest] = path;
  if (Array.isArray(root)) return root.map((x, i) => (i === h ? setIn(x, rest, v) : x));
  return { ...(root as object), [h]: setIn((root as Record<string, Json>)[h as string], rest, v) };
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

const input = "w-full rounded-lg border border-timetable-card-border bg-white px-3 py-2 text-sm text-ink focus:outline-primary";

function Field({ name, path, value, onChange }: { name: string; path: Path; value: Json; onChange: (p: Path, v: Json) => void }) {
  const k = key(path);
  if (HIDDEN.has(name) || HIDDEN.has(k)) return null;
  const label = LABEL[name] ?? name;

  if (CHOICES[name] && typeof value === "string")
    return (
      <label className="block">
        <span className="text-[13px] font-semibold text-ink/70">{label}</span>
        <select className={input} value={value} onChange={(e) => onChange(path, e.target.value)}>
          {CHOICES[name].map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
      </label>
    );
  if (typeof value === "boolean")
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value} onChange={(e) => onChange(path, e.target.checked)} className="accent-primary size-4" />
        {label}
      </label>
    );
  if (typeof value === "number")
    return (
      <label className="block">
        <span className="text-[13px] font-semibold text-ink/70">{label}</span>
        <input type="number" className={input} value={value} onChange={(e) => onChange(path, e.target.value === "" ? 0 : Number(e.target.value))} />
      </label>
    );
  if (typeof value === "string") {
    const long = value.includes("\n") || value.length > 40 || ["body", "sub", "desc", "quote"].includes(name);
    return (
      <label className="block">
        <span className="text-[13px] font-semibold text-ink/70">{label}</span>
        {long ? (
          <textarea className={input} rows={Math.max(2, value.split("\n").length + 1)} value={value} onChange={(e) => onChange(path, e.target.value)} />
        ) : (
          <input className={input} value={value} onChange={(e) => onChange(path, e.target.value)} />
        )}
      </label>
    );
  }
  if (Array.isArray(value)) {
    const fixed = FIXED_LIST.has(k);
    const move = (i: number, d: number) => {
      const next = [...value];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      onChange(path, next);
    };
    return (
      <fieldset className="rounded-xl border border-timetable-card-border p-3 space-y-2">
        <legend className="px-1 text-[13px] font-bold text-ink">{label}</legend>
        {value.map((item, i) => (
          <div key={i} className={isObj(item) ? "rounded-lg bg-[#f5f0ed] p-3 space-y-2" : "flex items-start gap-1"}>
            <div className={isObj(item) ? "flex items-center gap-1" : "contents"}>
              {isObj(item) && <span className="flex-1 text-[13px] font-bold text-primary">{i + 1}. {String(item.name ?? item.title ?? item.label ?? item.quote ?? "").slice(0, 30)}</span>}
              {!isObj(item) && (
                <div className="flex-1">
                  <Field name="" path={[...path, i]} value={item} onChange={onChange} />
                </div>
              )}
              <button type="button" title="위로" disabled={i === 0} onClick={() => move(i, -1)} className="p-1.5 text-ink/50 disabled:opacity-20">
                <ArrowUp size={16} />
              </button>
              <button type="button" title="아래로" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="p-1.5 text-ink/50 disabled:opacity-20">
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
          <button type="button" onClick={() => onChange(path, [...value, blank(value[value.length - 1])])} className="flex items-center gap-1 text-[13px] font-bold text-primary">
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
      <fieldset className="rounded-xl border border-timetable-card-border p-3 space-y-2">
        <legend className="px-1 text-[13px] font-bold text-ink">{label}</legend>
        {body}
      </fieldset>
    );
  }
  return null;
}

const SECTIONS = Object.keys(DEFAULT_DOC) as (keyof Doc)[];

export default function Editor() {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [saved, setSaved] = useState("");
  const [tab, setTab] = useState<keyof Doc>("hero");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);

  // 처음: 게시본(없으면 기본값)을 불러오고, 저장 안 한 고친 내용이 있으면 이어서 할지 묻는다.
  useEffect(() => {
    fetchPublished().then((pub) => {
      const base = merge(DEFAULT_DOC, pub);
      const draft = readDraft();
      const resume = draft && JSON.stringify(merge(DEFAULT_DOC, draft)) !== JSON.stringify(base) && confirm("저장하지 않은 고친 내용이 있어요. 이어서 고칠까요?");
      setSaved(JSON.stringify(base));
      setDoc(resume ? merge(DEFAULT_DOC, draft) : base);
      if (!pub && fileId() && !REMOTE.apiKey) setMsg("로그인하면 저장본을 불러와요.");
    });
  }, []);

  useEffect(() => {
    if (doc) localStorage.setItem(DRAFT_KEY, JSON.stringify(doc));
  }, [doc]);

  const dirty = !!doc && JSON.stringify(doc) !== saved;
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);

  const run = async (label: string, job: () => Promise<string | void>) => {
    setBusy(true);
    setMsg(`${label} 중…`);
    try {
      setMsg((await job()) || `${label} 끝`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setTick((t) => t + 1);
    }
  };

  const login = () =>
    run("로그인", async () => {
      await signIn();
      const s = await loadSaved();
      if (!s) return "로그인했어요. 아직 저장본이 없어요. 고친 뒤 「저장」을 누르면 드라이브에 파일이 만들어져요.";
      const base = merge(DEFAULT_DOC, s);
      setSaved(JSON.stringify(base));
      if (!dirty || confirm("드라이브 저장본을 불러올까요? 지금 고친 내용은 사라져요.")) setDoc(base);
      return "로그인했어요.";
    });

  const doSave = () =>
    run("저장", async () => {
      const made = await save(doc);
      setSaved(JSON.stringify(doc));
      if (made) return `저장했어요. 처음 만든 파일이에요. 아래 파일 ID를 TEMIS에 보내 주세요. 등록하면 상세페이지에 반영돼요: ${made}`;
      if (!REMOTE.fileId) return `저장했어요. 아직 등록 전이라 상세페이지에는 안 보여요. 파일 ID: ${fileId()}`;
      return `저장했어요 (${new Date().toLocaleTimeString("ko-KR")}). 상세페이지를 새로고침하면 바뀌어 있어요.`;
    });

  const reset = () => {
    if (confirm("이 칸들을 처음 기본값으로 되돌릴까요? 저장해야 반영돼요.")) setDoc({ ...doc!, [tab]: structuredClone(DEFAULT_DOC[tab]) });
  };

  if (!doc) return <p className="p-6 text-ink/60">불러오는 중…</p>;

  return (
    <div className="min-h-screen text-ink">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-timetable-card-border bg-[#f5f0ed]/95 px-4 py-2 backdrop-blur">
        <b className="font-[BagelFat] text-primary">TEMIS</b>
        <span className="text-sm font-bold">상세페이지 고치기 · {REMOTE.name}</span>
        <span className="flex-1" />
        <span className="text-[13px] text-ink/60">{dirty ? "● 저장 안 됨" : "저장됨"}</span>
        {!signedIn() && (
          <button type="button" disabled={busy} onClick={login} className="h-9 rounded-full border border-ink/20 bg-white px-4 text-sm font-bold">
            구글 로그인
          </button>
        )}
        <button type="button" disabled={busy || !dirty} onClick={doSave} className="h-9 rounded-full bg-primary px-5 text-sm font-bold text-white disabled:opacity-40">
          저장
        </button>
        <a href="./" target="_blank" className="flex items-center gap-1 text-[13px] text-ink/60">
          상세페이지 <ExternalLink size={14} />
        </a>
        {msg && <p className="w-full select-all text-[13px] text-ink/80">{msg}</p>}
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(380px,520px)_1fr]">
        <main className="space-y-3 p-4">
          <nav className="flex flex-wrap gap-1">
            {SECTIONS.filter((s) => s !== "brand").map((s) => (
              <button key={s} type="button" onClick={() => setTab(s)} className={`rounded-full px-3 py-1 text-[13px] font-semibold ${tab === s ? "bg-ink text-white" : "bg-white text-ink/70"}`}>
                {LABEL[s] ?? s}
              </button>
            ))}
          </nav>
          {tab === "hero" && <Field name="brand" path={["brand"]} value={doc.brand} onChange={(p, v) => setDoc((d) => setIn(d, p, v) as Doc)} />}
          <Field name={tab} path={[tab]} value={doc[tab]} onChange={(p, v) => setDoc((d) => setIn(d, p, v) as Doc)} />
          <button type="button" onClick={reset} className="text-[12px] text-ink/50 underline">
            이 탭을 기본값으로 되돌리기
          </button>
          <p className="text-[12px] leading-relaxed text-ink/50">
            줄바꿈은 그대로 보여요. 진행 순서의 {"{횟수}"}는 수정 횟수로 바뀌어요. 작업물 사진·첫 화면 디자인은 여기서 못 고쳐요.
          </p>
        </main>
        <aside className="hidden lg:block sticky top-[52px] h-[calc(100vh-52px)] border-l border-timetable-card-border">
          <iframe src="./?draft" title="미리보기" className="h-full w-full bg-white" />
        </aside>
      </div>
    </div>
  );
}
