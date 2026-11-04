import { useMemo, useRef, useState } from "react";
import CardStage from "./card/CardStage";
import { weekdayOption } from "./card/settings";
import { weekdays } from "./lib/format";
import type { TDefaultCard } from "./lib/types";
import { cn } from "./lib/utils";
import DayInput, { createInitialDay } from "./inputs/DayInput";

const DEFAULT_DAY = 0; // 월

/** 이번 주 월요일부터 7일 (원본도 월요일 기준으로 주를 잡음) */
const getWeekDates = () => {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

export default function App() {
  const weekDates = useMemo(getWeekDates, []);
  const [day, setDay] = useState<TDefaultCard>(() => createInitialDay(DEFAULT_DAY));
  const [flashKey, setFlashKey] = useState(0);
  const flashTimer = useRef<number | undefined>(undefined);

  // 입력할 때마다 반짝이면 산만하니, 입력이 잠깐 멈추면 한 번 반짝
  const flash = () => {
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashKey((k) => k + 1), 120);
  };

  const update = (next: TDefaultCard) => {
    setDay(next);
    flash();
  };

  const selectWeekday = (d: number) => {
    if (d === day.day) return;
    update({ ...day, day: d });
  };

  const reset = () => update(createInitialDay(DEFAULT_DAY));

  return (
    <main className="mx-auto w-full max-w-[1100px] md:px-6 md:py-6 md:grid md:grid-cols-[minmax(0,1fr)_400px] md:gap-8 md:items-start">
      {/* 카드: 폰에서는 위에 붙어 따라옴(키보드가 올라와도 보임), PC에서는 왼쪽 */}
      <section className="sticky top-0 z-30 bg-[#f5f0ed] px-3 pt-3 pb-2 md:px-0 md:pt-0 md:pb-0 md:top-6">
        <CardStage day={day} weekDate={weekDates[day.day]} flashKey={flashKey} />
      </section>

      <section className="flex flex-col gap-3 px-3 pt-2 pb-8 md:px-0 md:pt-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1" role="group" aria-label="요일 고르기">
            {weekdays.kr.map((label, i) => (
              <button
                key={label}
                type="button"
                aria-pressed={day.day === i}
                onClick={() => selectWeekday(i)}
                className={cn(
                  "w-8 h-8 rounded-full text-sm font-semibold transition-colors",
                  day.day === i
                    ? "bg-timetable-primary text-white"
                    : "bg-timetable-card-bg text-gray-600 hover:bg-timetable-input-hover"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={reset}
            className="shrink-0 h-8 px-3 rounded-full text-sm font-medium text-gray-600 bg-timetable-card-bg border-2 border-timetable-card-border hover:bg-timetable-input-hover"
          >
            처음으로
          </button>
        </div>

        {/* 체험존은 방송 1개만: 원본도 방송이 2개면 서브 타이틀을 그리지 않아서, 서브 타이틀이 늘 보이게 한다 */}
        <DayInput
          day={day}
          onChange={update}
          weekdayOption={weekdayOption}
          size="md"
          isMultiple={false}
        />
      </section>
    </main>
  );
}
