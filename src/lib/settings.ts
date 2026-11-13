import { useEffect, useState } from "react";

export type PricingSettings = { dailyRate: number; partnerMarginPct: number; crewSize: number; areaPerDay: number };
export const DEFAULT_SETTINGS: PricingSettings = { dailyRate: 2500, partnerMarginPct: 0, crewSize: 3, areaPerDay: 500 };
const KEY = "fassadex.pricing";

export function usePricingSettings() {
  const [s, setS] = useState<PricingSettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);
  const save = (next: PricingSettings) => {
    setS(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };
  return [s, save] as const;
}
