export const CURRENCIES = ["XOF", "GHS", "GNF", "LRD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_LABELS: Record<Currency, string> = {
  XOF: "Franc CFA (XOF)",
  GHS: "Cedi ghanéen (GHS)",
  GNF: "Franc guinéen (GNF)",
  LRD: "Dollar libérien (LRD)",
};

export const CREW_SEAT_NUMBERS = new Set(["1", "2", "3"]);

export function isCrewSeat(seatNumber: string): boolean {
  return CREW_SEAT_NUMBERS.has(seatNumber);
}
