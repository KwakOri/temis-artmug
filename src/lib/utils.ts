// 원본: src/lib/utils.ts, src/utils/utils.ts (cn, SizeProps)
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export type SizeProps = "sm" | "md" | "lg";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
