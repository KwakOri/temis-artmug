// 카드 한 장을 원본 크기(800×617)로 그리고 CSS scale로 폭에 맞춰 줄인다.
// 원본 시간표도 4000×2250으로 그린 뒤 transform: scale 로 줄여 보여 준다(TimeTableContent.tsx).
import { useLayoutEffect, useRef, useState } from "react";
import type { TDefaultCard } from "../lib/types";
import { Settings } from "./settings";
import TimeTableCell from "./TimeTableCell";

const W = Settings.card.online.width; // 800
const H = Settings.card.online.height; // 617
// 배경 png 좌우 40px는 투명 여백 → 폰에서 카드를 조금이라도 크게 보이도록 잘라 낸다
const CROP_X = 40;
const VIEW_W = W - CROP_X * 2; // 720

interface CardStageProps {
  day: TDefaultCard;
  weekDate: Date;
  flashKey: number;
}

const CardStage = ({ day, weekDate, flashKey }: CardStageProps) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.45);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / VIEW_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      className="relative w-full"
      style={{ aspectRatio: `${VIEW_W} / ${H}` }}
      aria-label="방송 카드 미리보기"
      role="img"
    >
      <div
        key={flashKey}
        className={flashKey > 0 ? "card-flash absolute inset-0" : "absolute inset-0"}
      >
        <div
          className="absolute select-none"
          style={{
            width: W,
            height: H,
            left: -CROP_X * scale,
            top: 0,
            transform: `scale(${scale})`,
            transformOrigin: "left top",
            isolation: "isolate",
          }}
        >
          {/* 원본 그리드에서 셀은 폭 720, 배경은 left:-40 으로 800 — 그래서 셀을 40 밀어 둔다 */}
          <div className="absolute z-20" style={{ left: 40, top: 0 }}>
            <TimeTableCell time={day} weekDate={weekDate} index={0} currentTheme="first" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardStage;
