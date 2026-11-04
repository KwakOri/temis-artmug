// 가격 계산: 가격표·견적·신청 양식 복사 글이 모두 이 결과를 본다.
import type { Option, Plan, PlanId } from "./data";

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export const optionPriceLabel = (o: Option, plan?: Plan) => {
  if (o.kind === "ask") return "별도 문의";
  if (o.kind === "percent") {
    const base = o.value === 100 ? "기본가만큼 추가" : `기본가의 ${o.value}% 추가`;
    return plan ? `+${won(Math.round((plan.price * o.value) / 100))}` : base;
  }
  if (o.value === 0) return "0원";
  return `${o.value > 0 ? "+" : "−"}${won(Math.abs(o.value))}`;
};

export interface Estimate {
  plan: Plan;
  lines: { name: string; label: string; amount: number }[];
  total: number;
  hasAsk: boolean;
}

export const estimate = (plans: Plan[], options: Option[], planId: PlanId, picked: Set<string>): Estimate => {
  const plan = plans.find((p) => p.id === planId) ?? plans[0];
  const lines = options
    .filter((o) => picked.has(o.id))
    .map((o) => {
      const amount = o.kind === "percent" ? Math.round((plan.price * o.value) / 100) : o.kind === "fixed" ? o.value : 0;
      return { name: o.name, label: optionPriceLabel(o, plan), amount };
    });
  const total = Math.max(0, plan.price + lines.reduce((s, l) => s + l.amount, 0));
  return { plan, lines, total, hasAsk: options.some((o) => picked.has(o.id) && o.kind === "ask") };
};
