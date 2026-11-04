// 원본: src/utils/date-formatter.ts(padZero), src/utils/time-formatter.ts(formatTime),
//       src/utils/time-table/data.ts(weekdays)
export function padZero(num: number): string {
  return num < 10 ? `0${num}` : num.toString();
}

type TimeFormat = "half" | "full";

export function formatTime(
  time: string,
  format: TimeFormat = "half",
  pad: boolean = true,
  halfText: { am?: string; pm?: string } = {},
): string {
  const [hourStr, minute] = time.split(":");
  const hour = Number(hourStr);

  if (format === "full") {
    const formattedHour = pad ? hour.toString().padStart(2, "0") : hour.toString();
    return `${formattedHour}:${minute}`;
  }

  const isAfternoon = hour >= 12;
  let displayHour = hour;
  if (hour === 0) displayHour = 12;
  else if (hour > 12) displayHour = hour - 12;

  const amPm = (isAfternoon ? (halfText.pm ?? "PM") : (halfText.am ?? "AM")).trim();
  const formattedHour = pad ? displayHour.toString().padStart(2, "0") : displayHour.toString();
  return amPm ? `${amPm} ${formattedHour}:${minute}` : `${formattedHour}:${minute}`;
}

export const weekdays = {
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  kr: ["월", "화", "수", "목", "금", "토", "일"],
  jp: ["月", "火", "水", "木", "金", "土", "日"],
};
