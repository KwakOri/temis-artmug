// 작업 자리: 구글 시트 「공개」 탭 CSV(tokpi와 같은 틀: 월,전체,예약,상태,안내).
// 주소가 없거나 못 읽으면 칸을 숨긴다. ?slots=demo 로 예시를 볼 수 있다.
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../lib/utils";

type Kind = "open" | "full" | "soon" | "off";
interface Slot {
  month: string;
  total: number;
  booked: number;
  kind: Kind;
  note: string;
}

const DEMO = [
  ["2026-11", "4", "2", "열림", ""],
  ["2026-12", "4", "0", "오픈 예정", "11월 20일 오픈"],
];

const parseCsv = (text: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") row.push(cell), (cell = "");
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell), rows.push(row), (row = []), (cell = "");
    } else cell += ch;
  }
  if (cell || row.length) row.push(cell), rows.push(row);
  return rows;
};

const toSlot = (r: string[]): Slot => {
  const total = Math.max(0, parseInt(r[1], 10) || 0);
  const booked = Math.min(total, Math.max(0, parseInt(r[2], 10) || 0));
  const st = (r[3] || "").trim();
  const kind: Kind = st === "오픈 예정" ? "soon" : st === "휴식" ? "off" : st === "마감" || booked >= total ? "full" : "open";
  // 시트가 「2026-11」을 「2026. 11. 1」처럼 내보내도 읽는다
  const ym = /(\d{4})\D+(\d{1,2})/.exec(r[0] || "");
  return { month: ym ? `${ym[1]}-${ym[2].padStart(2, "0")}` : "", total, booked, kind, note: (r[4] || "").trim() };
};

const PILL: Record<Kind, (s: Slot) => string> = {
  open: (s) => `${s.total - s.booked}자리 남음`,
  full: () => "마감",
  soon: () => "오픈 예정",
  off: () => "쉬어요",
};

export default function Slots({ csvUrl, note, head }: { csvUrl: string; note: string; head: ReactNode }) {
  const [rows, setRows] = useState<string[][] | null>(null);

  useEffect(() => {
    if (csvUrl) {
      fetch(csvUrl, { cache: "no-store" })
        .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
        .then((t) => setRows(parseCsv(t).slice(1)))
        .catch(() => setRows(null));
    } else if (/[?&]slots=demo\b/.test(location.search)) setRows(DEMO);
  }, [csvUrl]);

  if (!rows) return null;
  const now = new Date();
  const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const list = rows.map(toSlot).filter((s) => /^\d{4}-\d{2}/.test(s.month) && s.month >= cur).slice(0, 3);
  if (!list.length) return null;

  return (
    <section className="py-12 md:py-16 px-4">
      <div className="mx-auto max-w-[860px]">
        {head}
        <div className="grid sm:grid-cols-2 gap-3">
          {list.map((s) => (
            <article key={s.month} className={cn("rounded-2xl bg-white p-5 shadow-sm", s.kind !== "open" && "opacity-80")}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold">{+s.month.slice(5)}월</h3>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", s.kind === "open" ? "bg-primary text-white" : "bg-timetable-card-bg text-ink/70")}>
                  {PILL[s.kind](s)}
                </span>
              </div>
              {s.kind !== "off" && (
                <div className="mt-3 flex gap-1.5" aria-label={`전체 ${s.total}자리 중 ${s.booked}자리 예약`}>
                  {Array.from({ length: s.total }, (_, i) => (
                    <i key={i} className={cn("block h-3 flex-1 rounded-full", i < s.booked ? "bg-ink/70" : "bg-primary/25")} />
                  ))}
                </div>
              )}
              <p className="mt-2 text-[13px] text-ink/65">{s.note || (s.kind === "open" ? `${s.total}자리 중 ${s.booked}자리 예약` : "")}</p>
            </article>
          ))}
        </div>
        <p className="mt-3 text-center text-[13px] text-ink/60">
          <span data-edit="slots.note">{note}</span>
        </p>
      </div>
    </section>
  );
}
