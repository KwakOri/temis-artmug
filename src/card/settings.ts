// 원본: src/app/(root)/_sample/_settings/settings.ts, general.ts (카드 한 장에 필요한 부분만)

export const fontOption = {
  primary: "SchoolSafetyNotification",
  secondary: "BagelFat",
  tertiary: "",
  quaternary: "",
};

export type TLanOpt = "kr" | "en" | "jp";
export const weekdayOption: TLanOpt = "en";

export const colors = {
  first: { primary: "#FFF6E5", secondary: "#EC7363", tertiary: "", quaternary: "" },
  second: { primary: "", secondary: "", tertiary: "", quaternary: "" },
  third: { primary: "", secondary: "", tertiary: "", quaternary: "" },
};

export interface SimpleFieldConfig {
  key: string;
  type: "time" | "text" | "textarea";
  placeholder: string;
  required?: boolean;
  defaultValue: string;
  maxLength?: number;
}

export const CARD_INPUT_CONFIG = {
  fields: [
    { key: "time", type: "time", placeholder: "10:00", required: true, defaultValue: "10:00" },
    { key: "mainTitle", type: "textarea", placeholder: "메인 타이틀\n적는곳", defaultValue: "", maxLength: 30 },
    { key: "subTitle", type: "text", placeholder: "서브 타이틀 적는곳", defaultValue: "", maxLength: 20 },
  ] as SimpleFieldConfig[],
  offlineToggle: { label: "휴방" },
};

/** 원본 getPlaceholders(createPlaceholdersFromConfig) 결과와 같음 */
export const placeholders: Record<string, string> = Object.fromEntries(
  CARD_INPUT_CONFIG.fields.map((f) => [f.key, f.placeholder]),
);

/** 원본: 하루 최대 방송 수 (_uneditable/TimeTableEditor.tsx maxStreamingTimeByDay={2}) */
export const maxStreamingTimeByDay = 2;

export const Settings = {
  card: {
    online: {
      width: 800,
      height: 617,
      time: { fontSize: 34, fontColor: colors.first.primary },
      day: { fontSize: 56, fontColor: colors.first.primary },
      mainTitle: { fontSize: 88, fontColor: colors.first.secondary },
      subTitle: { fontSize: 57, fontColor: colors.first.primary },
    },
    offline: { width: 800, height: 617 },
  },
};
