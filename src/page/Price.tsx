// 가격 칸: 구성 칩 → 옵션 줄(「□ 이름 …… 금액」) → 감열지 영수증 (#20 견적 1안, A 레트로 기기 톤).
// 금액은 pricing.ts의 estimate 결과만 쓴다. 신청 양식 복사 글도 같은 결과를 보므로 화면 합계와 복사 금액이 같다.
// 폰(lg 미만): 가격 칸을 보는 동안 화면 아래에 합계 막대를 고정하고, 영수증이 보이면 숨긴다.
import { Check, ChevronUp, Plus, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/utils";
import type { Option, Plan, PlanId } from "./data";
import type { Estimate } from "./pricing";

const num = (n: number) => Math.abs(n).toLocaleString("ko-KR");
const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
const MONO = "mono";

/** 앞말 받침에 맞춰 와/과 */
const wa = (word: string) => {
  const c = word.charCodeAt(word.length - 1) - 0xac00;
  return c >= 0 && c <= 11171 && c % 28 ? "과" : "와";
};

const percentAmount = (o: Option, plan: Plan) => Math.round((plan.price * o.value) / 100);

/** 옵션 줄 오른쪽 금액 꼬리표 */
function Tag({ o, plan }: { o: Option; plan: Plan }) {
  if (o.kind === "ask") return <span className="shrink-0 rounded-md bg-[#1b1612]/10 text-[#1b1612]/70 text-[12px] font-bold px-2 py-0.5">별도 견적</span>;
  if (o.kind === "percent")
    return (
      <span className={cn(MONO, "shrink-0 text-[13px] md:text-sm font-bold text-[#1b1612]")}>
        기본가 {o.value}% <span className="text-primary">(+{num(percentAmount(o, plan))}원)</span>
      </span>
    );
  if (o.value === 0) return <span className="shrink-0 rounded-md bg-[#e2f0cf] text-[#3f7a22] text-[12px] font-bold px-2 py-0.5">무료</span>;
  if (o.value < 0) return <span className={cn(MONO, "shrink-0 rounded-md bg-[#ffe45c] text-[#1b1612] text-[13px] md:text-sm font-bold px-1.5")}>-{num(o.value)}원</span>;
  return <span className={cn(MONO, "shrink-0 text-[13px] md:text-sm font-bold text-primary")}>+{num(o.value)}원</span>;
}

function Line({ left, right, hl }: { left: ReactNode; right: ReactNode; hl?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-[3px]">
      <span className="min-w-0">{left}</span>
      <span className={cn("shrink-0 text-right", hl && "bg-[#ffe45c] px-1")}>{right}</span>
    </div>
  );
}

interface Props {
  brand: string;
  plans: Plan[];
  options: Option[];
  planId: PlanId;
  setPlanId: (id: PlanId) => void;
  picked: Set<string>;
  toggle: (id: string) => void;
  est: Estimate;
  revisions: number;
  period: string;
  head: ReactNode;
}

export default function Price({ brand, plans, options, planId, setPlanId, picked, toggle, est, revisions, period, head }: Props) {
  const section = useRef<HTMLElement>(null);
  const receipt = useRef<HTMLDivElement>(null);
  const [inSection, setInSection] = useState(false);
  const [receiptSeen, setReceiptSeen] = useState(false);

  useEffect(() => {
    const s = section.current;
    const r = receipt.current;
    if (!s || !r || typeof IntersectionObserver === "undefined") return;
    const os = new IntersectionObserver(([e]) => setInSection(e.isIntersecting), { rootMargin: "0px 0px -35% 0px" });
    const or = new IntersectionObserver(([e]) => setReceiptSeen(e.isIntersecting), { threshold: 0.35 });
    os.observe(s);
    or.observe(r);
    return () => {
      os.disconnect();
      or.disconnect();
    };
  }, []);

  const plan = est.plan;
  const pickedOpts = options.filter((o) => picked.has(o.id));
  const items = pickedOpts.filter((o) => !(o.kind === "fixed" && o.value < 0));
  const discounts = pickedOpts.filter((o) => o.kind === "fixed" && o.value < 0);
  const asks = pickedOpts.filter((o) => o.kind === "ask");
  const subtotal = plan.price + items.reduce((s, o) => s + (o.kind === "percent" ? percentAmount(o, plan) : o.kind === "fixed" ? o.value : 0), 0);
  /** 이 옵션을 막고 있는 고른 옵션들 */
  const blockers = (o: Option) =>
    options.filter((p) => p.id !== o.id && picked.has(p.id) && (o.conflicts?.includes(p.id) || p.conflicts?.includes(o.id)));
  const showBar = inSection && !receiptSeen;

  return (
    <section ref={section} id="price" className="scroll-mt-[52px] md:scroll-mt-[60px] bg-white py-12 md:py-16 px-4">
      <div className="mx-auto max-w-[1180px]">
        {head}
        <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-10 items-start">
          <div>
            {/* 구성 칩 */}
            <div className="grid grid-cols-3 gap-2 md:gap-3" role="radiogroup" aria-label="구성">
              {plans.map((p, pi) => {
                const on = planId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setPlanId(p.id)}
                    className={cn(
                      "relative text-left rounded-xl border-2 border-[#1b1612] px-2.5 md:px-4 py-2.5 md:py-3 transition-transform active:translate-x-px active:translate-y-px",
                      on ? "bg-[#1b1612] text-white shadow-[4px_4px_0_var(--color-primary)]" : "bg-[#fffdf9] text-[#1b1612] shadow-[3px_3px_0_#1b1612] hover:-translate-y-px"
                    )}
                  >
                    {p.badge && (
                      <span data-edit={`pricing.plans.${pi}.badge`} className="absolute -top-2.5 right-2 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-[11px] font-bold px-2 py-0.5 border-2 border-[#1b1612]">
                        {p.badge}
                      </span>
                    )}
                    <span data-edit={`pricing.plans.${pi}.name`} className="block font-bold text-[13.5px] md:text-base leading-tight">
                      {p.name.replace(/\s*시간표$/, "")}
                    </span>
                    <span data-edit={`pricing.plans.${pi}.price`} className={cn(MONO, "block mt-0.5 text-[13px] md:text-[15px] font-bold", on ? "text-secondary" : "text-[#1b1612]/70")}>{num(p.price)}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[13px] md:text-sm text-[#1b1612]/70 leading-relaxed">
              <b data-edit={`pricing.plans.${plans.indexOf(plan)}.name`} className="text-[#1b1612]">
                {plan.name}
              </b>{" "}
              · <span data-edit={`pricing.plans.${plans.indexOf(plan)}.desc`}>{plan.desc}</span>
              <span className="block mt-1 text-[12.5px] text-[#1b1612]/55">
                <span data-edit={`pricing.plans.${plans.indexOf(plan)}.points`}>{plan.points.join(" · ")}</span>
              </span>
            </p>

            {/* 옵션 줄 */}
            <h3 className="mt-6 mb-2 font-bold text-[15px] md:text-base">추가 옵션</h3>
            <ul className="rounded-2xl border-2 border-[#1b1612] bg-[#fffdf9] divide-y-2 divide-dashed divide-[#1b1612]/10 px-3 md:px-4">
              {options.map((o, oi) => {
                const on = picked.has(o.id);
                const by = on ? [] : blockers(o);
                const dim = by.length > 0;
                const names = by.map((b) => b.name).join("·");
                return (
                  <li key={o.id} className="flex items-start gap-2">
                    <button type="button" aria-pressed={on} onClick={() => toggle(o.id)} className="flex-1 min-w-0 text-left py-3">
                      <span className={cn("flex items-center gap-2.5 transition-opacity", dim && "opacity-40")}>
                        <span
                          className={cn(
                            "grid place-items-center shrink-0 w-[22px] h-[22px] rounded-md border-2",
                            on ? "bg-gradient-to-br from-primary to-secondary border-primary text-white" : "border-[#1b1612] bg-white"
                          )}
                        >
                          {on && <Check size={14} strokeWidth={3.2} />}
                        </span>
                        <span data-edit={`pricing.options.${oi}.name`} className="font-bold text-[14.5px] md:text-[15px] text-[#1b1612] shrink-0">
                          {o.name}
                        </span>
                        <span aria-hidden className="flex-1 min-w-3 self-end mb-[6px] border-b-2 border-dotted border-[#1b1612]/20" />
                        {/* 별도 견적은 값이 안 쓰여서 가격 방식(칸 목록)으로 보낸다 */}
                        <span data-edit={`pricing.options.${oi}.${o.kind === "ask" ? "kind" : "value"}`} className="shrink-0">
                          <Tag o={o} plan={plan} />
                        </span>
                      </span>
                      <span className={cn("block mt-1 pl-[32px] text-[12.5px] md:text-[13px] text-[#1b1612]/55 leading-snug", dim && "opacity-40")}>
                        <span data-edit={`pricing.options.${oi}.desc`}>{o.desc}</span>
                      </span>
                      {dim && (
                        <span className="block mt-1 pl-[32px] text-[12.5px] font-bold text-primary">
                          ↳ {names}
                          {wa(names)} 같이 고를 수 없어요
                        </span>
                      )}
                    </button>
                    {/* /edit 「눌러 고치기」에서만 보임(@artmug/editor). 코드에 묶인 옵션은 칸 목록(lists.locked)에서 잠근다 */}
                    <button type="button" data-edit-remove={`pricing.options.${oi}`} aria-label={`${o.name} 옵션 빼기`} className="mt-3 grid place-items-center shrink-0 w-[26px] h-[26px] rounded-full border-2 border-[#1b1612] bg-white text-[#1b1612] hover:bg-primary hover:text-white">
                      <X size={14} strokeWidth={3} />
                    </button>
                  </li>
                );
              })}
            </ul>
            <button type="button" data-edit-add="pricing.options" className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#2f6bff]/60 bg-[#2f6bff]/5 py-2.5 text-[14px] font-bold text-[#2f6bff]">
              <Plus size={16} strokeWidth={3} /> 옵션 추가
            </button>
          </div>

          {/* 영수증 */}
          <div ref={receipt} id="receipt" className="lg:sticky lg:top-[84px] scroll-mt-[72px]">
            <div className="rounded-t-2xl bg-[#1b1612] px-4 pt-3 pb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_var(--color-secondary)]" />
              <span className={cn(MONO, "text-[12px] text-white/60 tracking-wider")}>PRINTING ESTIMATE…</span>
              <span className="ml-auto h-1.5 w-24 rounded-full bg-black/60 border border-white/10" />
            </div>
            <div className="mx-2.5 -mt-2 drop-shadow-[0_6px_10px_rgba(27,22,18,0.16)]">
              <div className={cn(MONO, "bg-[#fffdf9] px-4 md:px-5 pt-5 pb-3 text-[13.5px] text-[#1b1612]")} aria-live="polite">
                <p className="text-center font-[BagelFat] text-xl tracking-wide">{brand} 주문서</p>
                <p className="text-center text-[12px] text-[#1b1612]/55 mt-0.5">맞춤 주간 시간표 · 예상 견적</p>
                <div className="my-3 border-t-2 border-dashed border-[#1b1612]/30" />
                <Line left={<span data-edit={`pricing.plans.${plans.indexOf(plan)}.name`}>{plan.name}</span>} right={num(plan.price)} />
                {items.map((o) => (
                  <Line
                    key={o.id}
                    left={
                      <>
                        <span data-edit={`pricing.options.${options.indexOf(o)}.name`}>{o.name}</span>
                        {o.kind === "percent" && ` ${o.value}%`}
                      </>
                    }
                    right={o.kind === "ask" ? "별도 견적" : o.kind === "percent" ? `+${num(percentAmount(o, plan))}` : o.value === 0 ? "무료" : `+${num(o.value)}`}
                  />
                ))}
                {discounts.length > 0 && (
                  <>
                    <div className="my-2 border-t border-dashed border-[#1b1612]/25" />
                    <Line left="소계" right={num(subtotal)} />
                    {discounts.map((o) => (
                      <Line key={o.id} left={<><span data-edit={`pricing.options.${options.indexOf(o)}.name`}>{o.name}</span> 할인</>} right={`-${num(o.value)}`} hl />
                    ))}
                  </>
                )}
                <div className="my-3 border-t-2 border-dashed border-[#1b1612]/30" />
                <div className="flex items-end justify-between gap-2">
                  <span className="font-bold">합계</span>
                  <span className="font-[BagelFat] text-[28px] md:text-[32px] leading-none text-primary">{won(est.total)}</span>
                </div>
                {asks.length > 0 && (
                  <p className="mt-2 flex justify-between gap-2 text-[12.5px] text-[#1b1612]/70">
                    <span>+ 별도 견적 {asks.length}건</span>
                    <span className="text-right">{asks.map((o) => o.name).join(", ")}</span>
                  </p>
                )}
                <div className="my-3 border-t-2 border-dashed border-[#1b1612]/30" />
                <Line left={<span data-edit={picked.has("omakase") ? "pricing.omakaseRevisions" : "pricing.revisions"}>수정 {revisions}회</span>} right={<span data-edit="pricing.period">{period}</span>} />
                <div aria-hidden className="barcode mt-4 h-11" />
                <p className="mt-2 text-center text-[11.5px] text-[#1b1612]/50 " style={{ fontFamily: '"Pretendard Variable", Pretendard, sans-serif' }}>최종 금액은 아트머그 결제 화면 기준이에요.</p>
              </div>
              <div aria-hidden className="receipt-edge" />
            </div>
          </div>
        </div>
      </div>

      {/* 폰: 아래 고정 합계 막대 */}
      <div
        className={cn(
          "lg:hidden fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 transition-transform duration-300",
          showBar ? "translate-y-0" : "translate-y-[120%] pointer-events-none"
        )}
        aria-hidden={!showBar}
      >
        <button
          type="button"
          tabIndex={showBar ? 0 : -1}
          onClick={() => receipt.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="w-full flex items-center gap-3 rounded-2xl bg-[#1b1612] text-white border-2 border-[#1b1612] shadow-[0_4px_0_var(--color-primary)] px-4 h-14"
        >
          <span className="text-left leading-tight">
            <span className="block text-[13px] font-bold">합계</span>
            <span className="block text-[11px] text-white/55">{plan.name.replace(/\s*시간표$/, "")}{pickedOpts.length ? ` + 옵션 ${pickedOpts.length}` : ""}</span>
          </span>
          <span className={cn(MONO, "ml-auto text-xl font-bold text-secondary")}>{won(est.total)}</span>
          {est.hasAsk && <span className="text-[11px] font-bold text-white/70">+별도</span>}
          <span className="flex items-center text-[12px] font-bold text-white/80">
            영수증 <ChevronUp size={18} />
          </span>
        </button>
      </div>
    </section>
  );
}
