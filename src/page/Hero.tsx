// 첫 화면 위쪽. 원본: Temis src/app/(root)/_sample/_components/SampleTimeTablePreview.tsx
// 시간표 안쪽은 _uneditable/TimeTableContent.tsx(배경·윗장식·주간 깃발·카드 7장·프로필 틀)를 칸이 빈 그대로 옮겼다.
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import calendar from "../assets/hero/calendar.webp";
import landingBg from "../assets/hero/landing_bg.webp";
import bgImg from "../assets/hero/background.webp";
import profileFrame from "../assets/hero/profile.webp";
import topObject from "../assets/hero/topobject.webp";
import TimeTableCell from "../card/TimeTableCell";
import { colors, fontOption } from "../card/settings";
import { createInitialDay } from "../inputs/DayInput";

const W = 4000;
const H = 2250;

/** 이번 주 월요일부터 7일 */
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

/** 원본 시간표 한 장(4000×2250)을 폭에 맞춰 줄여 그린다 */
const SampleTimeTable = () => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.275);
  const weekDates = useMemo(getWeekDates, []);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => createInitialDay(i)), []);
  const start = weekDates[0];
  const end = weekDates[6];

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="relative w-full shadow-lg rounded-sm" style={{ aspectRatio: `${W} / ${H}` }}>
      <div
        className="absolute select-none overflow-hidden rounded-[120px]"
        style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "left top" }}
        aria-hidden
      >
        <img src={topObject} alt="" draggable={false} className="absolute inset-0 z-30" style={{ width: W, height: H }} />

        {/* 주간 깃발 */}
        <p
          className="absolute z-40 flex justify-center items-center"
          style={{
            fontFamily: fontOption.primary,
            color: colors.first.primary,
            fontSize: 76,
            fontWeight: "bold",
            width: 580,
            height: 120,
            top: 564,
            left: 1556,
          }}
        >
          {start.getMonth() + 1}/{start.getDate()} ~ {end.getMonth() + 1}/{end.getDate()}
        </p>

        {/* 카드 7장: 3열, 화·목 다음 칸은 비운다(원본은 목 다음에 메모 칸이 꺼진 상태) */}
        <div className="absolute grid grid-cols-3 z-20" style={{ top: 96, left: 32, columnGap: 20, rowGap: 8 }}>
          {days.map((day, i) => (
            <div key={day.day} className="contents">
              <TimeTableCell time={day} weekDate={weekDates[i]} index={i} currentTheme="first" />
              {(i === 1 || i === 3) && <div />}
            </div>
          ))}
        </div>

        {/* 프로필 틀(사진은 비워 둔다) */}
        <img src={profileFrame} alt="" draggable={false} className="absolute inset-0 z-10" style={{ width: W, height: H }} />

        <img src={bgImg} alt="" draggable={false} className="absolute inset-0" style={{ width: W, height: H }} />
      </div>
    </div>
  );
};

export interface Stat {
  num: string;
  text: string;
  sub: string;
}

/** 누적 실적: 큰 숫자 + 문구. 아트머그에는 새로 왔지만 작업은 많이 해 왔다는 것을 먼저 보여 준다. */
const StatBadge = ({ stat }: { stat: Stat }) => (
  <div className="flex flex-col items-center gap-1.5 md:gap-2">
    <div className="flex items-center gap-2.5 md:gap-4 rounded-full bg-white/90 border-2 border-[#1B1612] shadow-[4px_4px_0_#1B1612] pl-4 pr-5 md:pl-6 md:pr-8 py-1.5 md:py-2">
      <span className="font-[BagelFat] text-[34px] md:text-[56px] leading-none" style={{ color: "#F56015" }}>
        {stat.num}
      </span>
      <span className="font-extrabold text-[15px] md:text-2xl text-left leading-tight" style={{ color: "#1B1612" }}>
        {stat.text}
      </span>
    </div>
    {stat.sub && <p className="text-[13px] md:text-base font-semibold text-[#1B1612]/70 max-w-[34em] text-balance">{stat.sub}</p>}
  </div>
);

export default function Hero({ stat, children }: { stat?: Stat; children?: React.ReactNode }) {
  return (
    // isolate: 달력(z-50)이 위쪽 고정 메뉴 위로 올라오지 않게 첫 화면 안에서만 쌓는다
    <div
      className="isolate overflow-hidden"
      style={{ backgroundImage: `url("${landingBg}")`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="flex flex-col items-center gap-3 md:gap-6 px-4 pt-8 pb-6 md:pt-12 md:pb-10 text-center">
        <p className="font-bold text-lg md:text-3xl" style={{ color: "#F56015" }}>
          비싼 포토샵을 대체! 편의성을 극대화!
        </p>
        <h1 className="font-extrabold text-[28px] md:text-[64px]" style={{ color: "#1B1612", lineHeight: 1.2 }}>
          버튜버가 만든, 버튜버를 위한
          <br />
          디자인 플랫폼
        </h1>
        {stat?.num && <StatBadge stat={stat} />}
      </div>

      {/* 주황 틀: 원본은 시간표(1100) 둘레로 52px씩, 모서리 72px, 아래로 갈수록 투명 */}
      <div className="mx-auto w-full max-w-[1204px] px-3 md:px-6">
        <div
          className="relative rounded-[28px] md:rounded-[72px] p-[4.3%]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(252,113,43,1) 0%, rgba(253,147,25,1) 70%, rgba(253,130,34,0) 100%)",
          }}
        >
          <img
            src={calendar}
            alt=""
            className="absolute z-50 w-[10%] top-[24%] -left-[4%]"
            style={{ rotate: "-12deg" }}
          />
          <SampleTimeTable />
        </div>
      </div>

      {children}
    </div>
  );
}
