// Temis 아트머그 상세페이지. 칸 순서·문구는 PLANS/TEMIS_ARTMUG_PAGE.md 4절, 값은 data.ts.
import { Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Heart, Pencil, RotateCcw, Smartphone, Users, X, ZoomIn } from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import DemoZone from "../DemoZone";
import Hero from "./Hero";
import { cn } from "../lib/utils";
import { doc, type FormField, type PlanId } from "./data";
import { readPending } from "./remote";
import { estimate, optionPriceLabel, won } from "./pricing";
import Slots from "./Slots";

const BASE = import.meta.env.BASE_URL;
// /edit 미리보기(?draft)에서는 아직 커밋 안 한 새 이미지를 data URL로 보여 준다.
const DRAFT = /[?&]draft\b/.test(location.search);
const workSrc = (src: string, size: "s" | "l") => (DRAFT && readPending()[src]?.[size]) || `${BASE}works/${src}-${size}.webp`;

/** 줄바꿈(\n)과 *강조*를 그린다 */
const rich = (text: string): ReactNode =>
  text.split("\n").map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line.split(/(\*[^*]+\*)/).map((part, j) =>
        /^\*[^*]+\*$/.test(part) ? (
          <span key={j} className="text-primary whitespace-nowrap">
            {part.slice(1, -1)}
          </span>
        ) : (
          part
        )
      )}
    </Fragment>
  ));

const NAV = [
  { id: "works", label: "작업물" },
  { id: "demo", label: "체험" },
  { id: "price", label: "가격" },
  { id: "process", label: "진행" },
  { id: "notice", label: "주의사항" },
];

/** 임시: 작업물이 적어서 캐러셀을 이 칸 수가 될 때까지 같은 목록으로 반복해 보여 준다(데이터는 그대로).
 *  작업물을 충분히 넣으면 0으로 바꾼다. */
const FILL_TO = 24;
const fill = <T,>(items: T[]) => {
  if (!items.length || items.length >= FILL_TO) return items;
  return Array.from({ length: Math.ceil(FILL_TO / items.length) }, () => items).flat();
};

const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const CAT_LABEL: Record<PlanId, string> = { structured: "정형", unstructured: "비정형", team: "팀" };
const BENEFIT_ICON = { pencil: Pencil, phone: Smartphone, users: Users, heart: Heart } as const;

function SectionHead({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mb-6 md:mb-8 text-center">
      <span className="font-[BagelFat] text-primary text-sm tracking-wider">{kicker}</span>
      <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-ink">{rich(title)}</h2>
      {sub && <p className="mt-2 text-[15px] text-ink/70 leading-relaxed text-balance">{rich(sub)}</p>}
    </div>
  );
}

export default function Page() {
  const { pricing } = doc;
  const [planId, setPlanId] = useState<PlanId>("unstructured");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");

  const est = useMemo(() => estimate(pricing.plans, pricing.options, planId, picked), [pricing, planId, picked]);
  const omakase = picked.has("omakase");
  const revisions = omakase ? pricing.omakaseRevisions : pricing.revisions;
  const works = fill(doc.works.items);
  const track = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const zoomBy = (d: number) => setZoom((z) => (z === null ? z : (z + d + works.length) % works.length));
  /** 캐러셀을 카드 한 장(+간격)만큼 넘긴다 */
  const slide = (d: number) => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (el && card) el.scrollBy({ left: d * (card.offsetWidth + 20), behavior: "smooth" });
  };

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (zoom === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(null);
      else if (e.key === "ArrowLeft") zoomBy(-1);
      else if (e.key === "ArrowRight") zoomBy(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  const toggleOption = (id: string) => {
    const opt = pricing.options.find((o) => o.id === id);
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        opt?.conflicts?.forEach((c) => next.delete(c));
      }
      return next;
    });
  };

  const visible = (f: FormField) =>
    f.showIf === "omakaseOff" ? !omakase : f.showIf === "team" ? planId === "team" : true;

  const copyText = () => {
    const lines = [
      `[${doc.brand} 맞춤 시간표 신청]`,
      `구성: ${est.plan.name} (${won(est.plan.price)})`,
      `옵션: ${est.lines.length ? est.lines.map((l) => `${l.name}(${l.label})`).join(", ") : "없음"}`,
      `예상 견적: ${won(est.total)}${est.hasAsk ? " + 별도 문의" : ""}`,
      `오마카세: ${omakase ? "예" : "아니요"}`,
      ...doc.form.fields.filter(visible).map((f) => `${f.label}: ${(form[f.id] ?? "").trim()}`),
    ];
    return lines.join("\n");
  };

  const copy = async () => {
    const missing = doc.form.fields.filter((f) => visible(f) && f.required && !(form[f.id] ?? "").trim());
    if (missing.length) {
      setToast(`「${missing[0].label}」 칸을 채워 주세요`);
      document.getElementById(`f-${missing[0].id}`)?.focus();
      return;
    }
    const text = copyText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setToast("복사했어요. 아트머그 「작가에게 문의」에 붙여 넣어 주세요");
  };

  const pickWork = (cat: PlanId) => {
    setPlanId(cat);
    setZoom(null);
    go("price");
  };

  const zoomed = zoom !== null ? works[zoom] : null;

  return (
    <div className="min-h-screen bg-[#f5f0ed] text-ink">
      {/* 고정 메뉴 */}
      <nav className="sticky top-0 z-40 h-[52px] md:h-[60px] bg-[#f5f0ed]/90 backdrop-blur border-b border-timetable-card-border">
        <div className="mx-auto max-w-[1180px] h-full px-3 md:px-6 flex items-center gap-3">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="font-[BagelFat] text-primary text-lg md:text-xl">
            {doc.brand}
          </button>
          <div className="flex-1 flex gap-0.5 md:gap-2 overflow-x-auto scrollbar-hide">
            {NAV.map((n) => (
              <button key={n.id} type="button" onClick={() => go(n.id)} className="shrink-0 px-2 py-1 text-[13px] md:text-sm font-semibold text-ink/70 hover:text-primary">
                {n.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => go("form")} className="shrink-0 h-8 md:h-9 px-3 md:px-4 rounded-full bg-primary text-white text-[13px] md:text-sm font-bold">
            신청 양식
          </button>
        </div>
      </nav>

      {/* 1. 첫 화면 */}
      <header className="relative overflow-hidden">
        <div className="bg-ink text-white text-center text-[13px] md:text-sm font-semibold py-2">{doc.hero.strip}</div>
        <Hero>
          <div className="relative pt-5 md:pt-6 pb-10 md:pb-14 flex gap-2 justify-center">
            <button type="button" onClick={() => go("price")} className="h-11 px-5 rounded-full bg-primary text-white font-bold">
              가격 보기
            </button>
            <button type="button" onClick={() => go("form")} className="h-11 px-5 rounded-full bg-white border-2 border-timetable-card-border font-bold">
              신청 양식
            </button>
          </div>
        </Hero>
      </header>

      {/* 2. 혜택 */}
      <section className="bg-white py-12 md:py-16 px-4">
        <div className="mx-auto max-w-[1180px]">
          <SectionHead kicker="WHY TEMIS" title="이미지 한 장이 아니라 *매주 쓰는 시간표*" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {doc.benefits.map((b) => {
              const Icon = BENEFIT_ICON[b.icon as keyof typeof BENEFIT_ICON];
              return (
                <div key={b.title} className="rounded-2xl bg-[#f5f0ed] p-4 md:p-5">
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary/15 text-primary">
                    <Icon size={20} strokeWidth={2.4} />
                  </span>
                  <h3 className="mt-3 font-bold text-[15px] md:text-base">{b.title}</h3>
                  <p className="mt-1 text-[13px] md:text-sm text-ink/70 leading-relaxed">{b.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. 작업물 */}
      <section id="works" className="scroll-mt-[52px] md:scroll-mt-[60px] py-12 md:py-16">
        <div className="mx-auto max-w-[1180px] px-4">
          <SectionHead kicker="WORKS" title={doc.works.title.replace("{숫자}", doc.works.count)} sub={doc.works.sub} />
        </div>
        {/* 톡피 상세페이지 갤러리처럼: 가로로 넘기고(폰은 손가락), 카드는 번갈아 살짝 기울인다 */}
        <div className="relative mx-auto max-w-[1280px]">
          <div
            ref={track}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-[max(1rem,calc(50%-150px))] md:px-10 pt-3 pb-6"
          >
            {works.map((w, i) => (
              <button
                key={`${w.src}-${i}`}
                type="button"
                onClick={() => setZoom(i)}
                className={cn(
                  "group shrink-0 snap-center w-[300px] md:w-[400px] text-left rounded-2xl bg-white p-2 border-2 border-ink shadow-[5px_5px_0_var(--color-ink)] transition-transform hover:rotate-0",
                  i % 2 ? "rotate-[1.2deg]" : "-rotate-[1.2deg]"
                )}
              >
                <span className="relative block overflow-hidden rounded-xl aspect-video bg-timetable-card-bg">
                  <img src={workSrc(w.src, "s")} alt={w.title} loading="lazy" draggable={false} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform" />
                  <ZoomIn size={18} className="absolute right-2 top-2 text-white drop-shadow" />
                </span>
                <span className="flex items-center gap-2 px-1.5 pt-2 pb-1">
                  <span className="rounded-full bg-primary/15 text-primary text-[11px] font-bold px-2 py-0.5">{CAT_LABEL[w.cat]}</span>
                  <span className="text-[13px] md:text-sm font-semibold truncate">{w.title}</span>
                </span>
              </button>
            ))}
          </div>
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-label={d < 0 ? "이전 작업물" : "다음 작업물"}
              onClick={() => slide(d)}
              className={cn(
                "hidden md:grid absolute top-[calc(50%-12px)] -translate-y-1/2 place-items-center w-11 h-11 rounded-full bg-white border-2 border-ink shadow-[3px_3px_0_var(--color-ink)] text-ink hover:text-primary",
                d < 0 ? "left-2" : "right-2"
              )}
            >
              {d < 0 ? <ChevronLeft size={22} strokeWidth={2.6} /> : <ChevronRight size={22} strokeWidth={2.6} />}
            </button>
          ))}
        </div>
        <p className="mt-1 text-center text-[13px] text-ink/50 md:hidden">← 옆으로 넘겨 보세요 →</p>
      </section>

      {/* 체험 */}
      <section id="demo" className="scroll-mt-[52px] md:scroll-mt-[60px] bg-white py-12 md:py-16 md:px-4">
        <div className="mx-auto max-w-[1180px]">
          <div className="px-4 md:px-0">
            <SectionHead kicker="TRY IT" title={doc.demo.title} sub={doc.demo.sub} />
          </div>
          <div className="rounded-none md:rounded-3xl bg-[#f5f0ed] md:p-6">
            <DemoZone embedded />
          </div>
        </div>
      </section>

      {/* 4. 후기 */}
      <section className="py-12 md:py-16 px-4">
        <div className="mx-auto max-w-[1180px]">
          <SectionHead kicker="REVIEW" title="먼저 써 본 분들의 이야기" />
          <div className="grid md:grid-cols-2 gap-3 md:gap-4">
            {doc.reviews.map((r) => (
              <figure key={r.quote} className="rounded-2xl bg-white p-5 md:p-6 shadow-sm">
                <blockquote className="font-bold text-[15px] md:text-base leading-snug">“{r.quote}”</blockquote>
                <p className="mt-3 text-[13px] md:text-sm text-ink/65 leading-relaxed">{rich(r.body)}</p>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 5. 가격 */}
      <section id="price" className="scroll-mt-[52px] md:scroll-mt-[60px] bg-white py-12 md:py-16 px-4">
        <div className="mx-auto max-w-[1180px]">
          <SectionHead kicker="PRICE" title="구성을 골라 보세요" sub={`작업 기간은 ${pricing.period}예요.`} />
          <div className="grid md:grid-cols-3 gap-3 md:gap-4">
            {pricing.plans.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={planId === p.id}
                onClick={() => setPlanId(p.id)}
                className={cn(
                  "relative text-left rounded-2xl p-5 border-2 transition-colors",
                  planId === p.id ? "border-primary bg-primary/5" : "border-timetable-card-border bg-white hover:border-primary/50"
                )}
              >
                {p.badge && <span className="absolute -top-3 right-4 rounded-full bg-primary text-white text-xs font-bold px-2.5 py-1">{p.badge}</span>}
                <span className="flex items-center justify-between">
                  <span className="font-bold text-lg">{p.name}</span>
                  <span className={cn("grid place-items-center w-6 h-6 rounded-full border-2", planId === p.id ? "bg-primary border-primary text-white" : "border-timetable-card-border")}>
                    {planId === p.id && <Check size={14} strokeWidth={3} />}
                  </span>
                </span>
                <span className="block mt-1 text-2xl font-extrabold">{won(p.price)}</span>
                <span className="block mt-2 text-[13px] text-ink/70">{p.desc}</span>
                <ul className="mt-3 space-y-1">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-1.5 text-[13px]">
                      <Check size={14} className="text-primary" /> {pt}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          <h3 className="mt-8 mb-3 font-bold text-lg">추가 옵션</h3>
          <div className="grid md:grid-cols-2 gap-2">
            {pricing.options.map((o) => {
              const on = picked.has(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleOption(o.id)}
                  className={cn(
                    "flex items-start gap-3 text-left rounded-xl p-3.5 border-2 transition-colors",
                    on ? "border-primary bg-primary/5" : "border-timetable-card-border bg-white"
                  )}
                >
                  <span className={cn("mt-0.5 grid place-items-center shrink-0 w-5 h-5 rounded-md border-2", on ? "bg-primary border-primary text-white" : "border-timetable-card-border")}>
                    {on && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className="flex-1">
                    <span className="flex justify-between gap-2">
                      <span className="font-bold text-[15px]">{o.name}</span>
                      <span className={cn("shrink-0 text-sm font-bold", o.value < 0 ? "text-[#2f8f5b]" : "text-primary")}>
                        {optionPriceLabel(o, o.kind === "percent" ? est.plan : undefined)}
                      </span>
                    </span>
                    <span className="block mt-0.5 text-[13px] text-ink/65">{o.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl bg-ink text-white p-5 md:flex md:items-end md:justify-between">
            <div>
              <p className="text-sm text-white/70">예상 견적 · {est.plan.name}{est.lines.length ? ` + 옵션 ${est.lines.length}개` : ""} · 수정 {revisions}회</p>
              <p className="mt-1 text-3xl font-extrabold">
                {won(est.total)}
                {est.hasAsk && <span className="ml-2 text-base font-bold text-secondary">+ 별도 문의</span>}
              </p>
            </div>
            <p className="mt-2 md:mt-0 text-[13px] text-white/60">최종 금액은 아트머그 결제 화면 기준이에요.</p>
          </div>
        </div>
      </section>

      {/* 6. 일정 (시트가 없으면 숨김) */}
      <Slots csvUrl={doc.slots.csvUrl} note={doc.slots.note} head={<SectionHead kicker="SLOT" title="이달의 작업 자리" />} />

      {/* 7. 작업 순서 */}
      <section id="process" className="scroll-mt-[52px] md:scroll-mt-[60px] py-12 md:py-16 px-4">
        <div className="mx-auto max-w-[1180px]">
          <SectionHead kicker="PROCESS" title="이렇게 진행돼요" />
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {doc.process.map((s, i) => (
              <li key={s.title} className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="font-[BagelFat] text-primary text-xl">{String(i + 1).padStart(2, "0")}</span>
                <b className="block mt-1">{s.title}</b>
                <p className="mt-1 text-[13px] text-ink/70 leading-relaxed">{s.body.replace("{횟수}", String(revisions))}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 8. 주의사항 */}
      <section id="notice" className="scroll-mt-[52px] md:scroll-mt-[60px] bg-white py-12 md:py-16 px-4">
        <div className="mx-auto max-w-[860px]">
          <SectionHead kicker="NOTICE" title="신청 전에 꼭 읽어 주세요" />
          <div className="space-y-2">
            {doc.notice.map((n) => (
              <details key={n.title} open={n.must} className="group rounded-xl bg-[#f5f0ed] px-4 py-3">
                <summary className="flex items-center gap-2 cursor-pointer list-none font-bold">
                  {n.must && <span className="rounded bg-primary text-white text-[11px] px-1.5 py-0.5">필독</span>}
                  <span className="flex-1">{n.title}</span>
                  <ChevronDown size={18} className="text-ink/50 transition-transform group-open:rotate-180" />
                </summary>
                <ul className="mt-2 space-y-1 text-[14px] text-ink/75 leading-relaxed list-disc pl-5">
                  {n.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 9. 신청 양식 */}
      <section id="form" className="scroll-mt-[52px] md:scroll-mt-[60px] py-12 md:py-16 px-4">
        <div className="mx-auto max-w-[860px]">
          <SectionHead kicker="ORDER" title="신청 양식" sub="채운 뒤 복사해서 아트머그 「작가에게 문의」로 보내 주세요." />
          <div className="rounded-2xl bg-white p-4 md:p-6 shadow-sm space-y-4">
            <div className="rounded-xl bg-[#f5f0ed] p-3.5 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-bold">고른 구성</span>
                <button type="button" onClick={() => go("price")} className="text-primary font-semibold text-[13px]">
                  바꾸기
                </button>
              </div>
              <p className="mt-1">
                {est.plan.name}
                {est.lines.length ? ` · ${est.lines.map((l) => l.name).join(", ")}` : ""}
              </p>
              <p className="mt-1 font-bold">
                예상 견적 {won(est.total)}
                {est.hasAsk ? " + 별도 문의" : ""}
              </p>
            </div>
            {doc.form.fields.filter(visible).map((f) => (
              <label key={f.id} className="block">
                <span className="text-sm font-bold">
                  {f.label}
                  {f.required && <span className="text-primary"> *</span>}
                </span>
                {f.type === "longtext" ? (
                  <textarea
                    id={`f-${f.id}`}
                    rows={3}
                    value={form[f.id] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-[#f5f0ed] px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-primary/50"
                  />
                ) : (
                  <input
                    id={`f-${f.id}`}
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    inputMode={f.type === "number" ? "numeric" : undefined}
                    value={form[f.id] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
                    className="mt-1 w-full h-11 rounded-xl bg-[#f5f0ed] px-3 text-base outline-none focus:ring-2 focus:ring-primary/50"
                  />
                )}
              </label>
            ))}
            <p className="text-[13px] text-ink/60">📎 {doc.form.attachNote}</p>
            <div className="flex gap-2">
              <button type="button" onClick={copy} className="flex-1 h-12 rounded-full bg-primary text-white font-bold flex items-center justify-center gap-1.5">
                <Copy size={18} /> 양식 복사
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm({});
                  setToast("양식을 비웠어요");
                }}
                className="h-12 px-4 rounded-full bg-[#f5f0ed] font-bold flex items-center gap-1.5"
              >
                <RotateCcw size={16} /> 초기화
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="pb-10 text-center text-[12px] text-ink/40">© {doc.brand}</footer>

      {/* 작업물 크게 보기 */}
      {zoomed && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-3" onClick={() => setZoom(null)} role="dialog" aria-modal="true" aria-label={zoomed.title}>
          <button type="button" aria-label="닫기" className="absolute right-3 top-3 grid place-items-center w-10 h-10 rounded-full bg-white/15 text-white">
            <X size={22} />
          </button>
          <img
            src={workSrc(zoomed.src, "l")}
            alt={zoomed.title}
            className="max-w-full max-h-[75vh] rounded-xl"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              const dx = touchX.current === null ? 0 : e.changedTouches[0].clientX - touchX.current;
              touchX.current = null;
              if (Math.abs(dx) > 40) zoomBy(dx < 0 ? 1 : -1);
            }}
          />
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-label={d < 0 ? "이전 작업물" : "다음 작업물"}
              onClick={(e) => {
                e.stopPropagation();
                zoomBy(d);
              }}
              className={cn("absolute top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/15 text-white hover:bg-white/30", d < 0 ? "left-2 md:left-6" : "right-2 md:right-6")}
            >
              {d < 0 ? <ChevronLeft size={26} /> : <ChevronRight size={26} />}
            </button>
          ))}
          <div className="mt-3 flex items-center gap-3 text-white" onClick={(e) => e.stopPropagation()}>
            <span className="font-semibold">{zoomed.title}</span>
            <button type="button" onClick={() => pickWork(zoomed.cat)} className="h-9 px-4 rounded-full bg-primary font-bold text-sm">
              {CAT_LABEL[zoomed.cat]} 구성으로 신청
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed left-1/2 bottom-6 z-50 -translate-x-1/2 rounded-full bg-ink text-white text-sm font-semibold px-4 py-2.5 shadow-lg max-w-[90vw] text-center">
          {toast}
        </div>
      )}
    </div>
  );
}
