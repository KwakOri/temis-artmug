// 원본: src/types/time-table/data.ts (필요한 부분만)
export interface TEntry {
  time: string;
  mainTitle: string;
  isGuerrilla: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface TDefaultCard {
  day: number;
  isOffline: boolean;
  entries: TEntry[];
}

export type TTheme = "first" | "second" | "third";
