// 작업물 전체 보기: 페이지 위에 덮는 갤러리(구성 필터 → 그리드 → 눌러서 크게 보기·좌우 넘기기 → 「○○ 구성으로 신청」).
// 새 창 대신 덮개로 띄운다. 아트머그는 상세페이지를 고정 높이 iframe에 넣으므로, iframe 안 fixed 덮개는 보이는 칸을 그대로 채우고
// 손님이 아트머그를 떠나지 않는다(새 창은 iframe sandbox에서 막힐 수 있고, 신청하러 돌아올 때 고른 구성도 이어지지 않는다).
// 손님 이름이 든 작업물 제목은 보여 주지 않고 구성·번호만 쓴다(갤러리에 손님 이름 금지).
// 사진이 많아도 가볍게: 목록은 줄인 사진(-s)만 lazy로, 크게 볼 때만 큰 사진(-l). 카드는 48장씩 더 그린다.
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../lib/utils";
import type { PlanId } from "./data";

export interface Work {
  src: string;
  cat: PlanId;
  title: string;
}

const CATS: [PlanId | "all", string][] = [
  ["all", "전체"],
  ["structured", "정형"],
  ["unstructured", "비정형"],
  ["team", "팀"],
];
const LABEL: Record<PlanId, string> = { structured: "정형", unstructured: "비정형", team: "팀" };
const STEP = 48;
const no = (n: number) => String(n).padStart(2, "0");

interface Props {
  works: Work[];
  count: string;
  src: (src: string, size: "s" | "l") => string;
  onApply: (cat: PlanId) => void;
  onClose: () => void;
}

export default function Gallery({ works, count, src, onApply, onClose }: Props) {
  const [cat, setCat] = useState<PlanId | "all">("all");
  const [shown, setShown] = useState(STEP);
  const [zoom, setZoom] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const more = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  // 번호는 전체 목록 순서(필터를 바꿔도 같은 작업물은 같은 번호)
  const all = useMemo(() => works.map((w, i) => ({ ...w, n: i + 1 })), [works]);
  const list = cat === "all" ? all : all.filter((w) => w.cat === cat);
  const per = (c: PlanId | "all") => (c === "all" ? all.length : all.filter((w) => w.cat === c).length);
  const z = zoom !== null ? list[zoom] : null;
  const step = (d: number) => setZoom((i) => (i === null ? i : (i + d + list.length) % list.length));

  // 덮개가 떠 있는 동안 뒤 페이지는 스크롤하지 않는다
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") zoom === null ? onClose() : setZoom(null);
      else if (zoom !== null && e.key === "ArrowLeft") step(-1);
      else if (zoom !== null && e.key === "ArrowRight") step(1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [zoom, list.length]);

  // 끝에 가까워지면 카드를 더 그린다
  useEffect(() => {
    const el = more.current;
    if (!el || shown >= list.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShown((s) => s + STEP), { root: scroller.current, rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [shown, list.length]);

  const pick = (c: PlanId | "all") => {
    setCat(c);
    setShown(STEP);
    scroller.current?.scrollTo({ top: 0 });
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="작업물 전체 보기" className="fixed inset-0 z-50 flex flex-col bg-[#f5f0ed] text-[#1b1612]">
      {/* 기기 윗면: 잉크 띠 + 불빛 + 개수 */}
      <div className="shrink-0 bg-[#1b1612] text-white">
        <div className="mx-auto max-w-[1180px] flex items-center gap-2.5 px-3 md:px-6 h-[52px] md:h-[60px]">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_var(--color-secondary)]" />
          <b className="font-[BagelFat] text-lg md:text-xl tracking-wide">WORKS</b>
          <span className="mono text-[12px] md:text-[13px] text-white/60 truncate">
            {no(all.length)}개 · {count}의 스트리머와 함께
          </span>
          <button type="button" onClick={onClose} aria-label="닫기" className="ml-auto grid place-items-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20">
            <X size={20} />
          </button>
        </div>
      </div>

      <div ref={scroller} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-[1180px] px-3 md:px-6 pt-4 md:pt-6 pb-10">
          {/* 구성 필터 */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2" role="tablist" aria-label="구성">
            {CATS.map(([c, t]) => {
              const on = cat === c;
              const n = per(c);
              return (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  disabled={!n}
                  onClick={() => pick(c)}
                  className={cn(
                    "shrink-0 flex items-center gap-1.5 rounded-xl border-2 border-[#1b1612] px-3.5 h-10 font-bold text-[14px] transition-transform disabled:opacity-35",
                    on ? "bg-[#1b1612] text-white shadow-[3px_3px_0_var(--color-primary)]" : "bg-[#fffdf9] shadow-[3px_3px_0_#1b1612] hover:-translate-y-px"
                  )}
                >
                  {t}
                  <span className={cn("mono text-[12px]", on ? "text-secondary" : "text-[#1b1612]/50")}>{n}</span>
                </button>
              );
            })}
          </div>

          {/* 그리드 */}
          <ul className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {list.slice(0, shown).map((w, i) => (
              <li key={`${w.src}-${w.n}`}>
                <button
                  type="button"
                  onClick={() => setZoom(i)}
                  className="group block w-full text-left rounded-xl md:rounded-2xl bg-white p-1.5 md:p-2 border-2 border-[#1b1612] shadow-[3px_3px_0_#1b1612] md:shadow-[4px_4px_0_#1b1612] transition-transform hover:-translate-y-0.5 active:translate-x-px active:translate-y-px"
                >
                  <span className="block overflow-hidden rounded-lg aspect-video bg-timetable-card-bg">
                    <img
                      src={src(w.src, "s")}
                      alt={`${LABEL[w.cat]} 시간표 작업물 ${w.n}`}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                    />
                  </span>
                  <span className="flex items-center gap-1.5 px-1 pt-1.5 pb-0.5">
                    <span className="rounded-full bg-primary/15 text-primary text-[11px] font-bold px-2 py-0.5">{LABEL[w.cat]}</span>
                    <span className="mono ml-auto text-[11.5px] text-[#1b1612]/45">#{no(w.n)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {shown < list.length && <div ref={more} className="h-10" />}
          <p className="mt-8 text-center text-[13px] text-[#1b1612]/55">마음에 드는 작업물을 누르면 크게 보고, 같은 구성으로 바로 신청할 수 있어요.</p>
        </div>
      </div>

      {/* 크게 보기 */}
      {z && (
        <div className="absolute inset-0 z-10 bg-[#1b1612]/92 flex flex-col items-center justify-center p-3" onClick={() => setZoom(null)}>
          <button type="button" aria-label="닫기" className="absolute right-3 top-3 grid place-items-center w-10 h-10 rounded-full bg-white/15 text-white">
            <X size={22} />
          </button>
          <div
            className="max-w-full rounded-xl md:rounded-2xl bg-white p-1.5 md:p-2 border-2 border-[#1b1612] shadow-[5px_5px_0_var(--color-primary)]"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              const dx = touchX.current === null ? 0 : e.changedTouches[0].clientX - touchX.current;
              touchX.current = null;
              if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
            }}
          >
            <img key={z.src + z.n} src={src(z.src, "l")} alt={`${LABEL[z.cat]} 시간표 작업물 ${z.n}`} className="block max-w-full max-h-[68vh] rounded-lg" />
          </div>
          {list.length > 1 &&
            ([-1, 1] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-label={d < 0 ? "이전 작업물" : "다음 작업물"}
                onClick={(e) => {
                  e.stopPropagation();
                  step(d);
                }}
                className={cn("hidden md:grid absolute top-1/2 -translate-y-1/2 place-items-center w-12 h-12 rounded-full bg-white/15 text-white hover:bg-white/30", d < 0 ? "left-6" : "right-6")}
              >
                {d < 0 ? <ChevronLeft size={26} /> : <ChevronRight size={26} />}
              </button>
            ))}
          {/* 폰: 화살표는 사진 위가 아니라 아래 줄에(사진 가장자리를 가리지 않게). 옆으로 밀어도 넘어간다 */}
          <div className="mt-4 flex items-center gap-2 md:gap-3 text-white" onClick={(e) => e.stopPropagation()}>
            {list.length > 1 && (
              <button type="button" aria-label="이전 작업물" onClick={() => step(-1)} className="md:hidden grid place-items-center w-10 h-10 rounded-full bg-white/15">
                <ChevronLeft size={22} />
              </button>
            )}
            <span className="mono text-[13px] text-white/70">
              {no(zoom! + 1)} / {no(list.length)}
            </span>
            {list.length > 1 && (
              <button type="button" aria-label="다음 작업물" onClick={() => step(1)} className="md:hidden grid place-items-center w-10 h-10 rounded-full bg-white/15">
                <ChevronRight size={22} />
              </button>
            )}
            <button type="button" onClick={() => onApply(z.cat)} className="h-10 px-4 rounded-full bg-primary border-2 border-[#1b1612] shadow-[3px_3px_0_#000] font-bold text-sm">
              {LABEL[z.cat]} 구성으로 신청
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
