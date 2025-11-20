export type PlanId = "simple" | "pro";

const SIMPLE_BASE = 520;
const PRO_BONUS = 60;

const clamp = (value: number, min = 300, max = 900) =>
  Math.min(Math.max(value, min), max);

const hashString = (input: string) => {
  let hash = 0;
  for (const char of input) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const generateMockScore = (address: string, plan: PlanId) => {
  const base = SIMPLE_BASE + (plan === "pro" ? PRO_BONUS : 0);
  const variability = hashString(address.toLowerCase()) % 320;
  return clamp(base + variability);
};
