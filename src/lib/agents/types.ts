// Shared types for the multi-agent plan generation pipeline.

export type PlanRequest = {
  city?: string;
  occasionId?: string;
  occasionLabel?: string;
  vibeId?: string;
  vibeLabel?: string;
  groupSize?: number;
  /** ISO date YYYY-MM-DD */
  date?: string;
  /** HH:MM 24h */
  startTime?: string;
  duration?: string;
  /** 1-4 ($ to $$$$) */
  budget?: 1 | 2 | 3 | 4;
};

export type PlanStop = {
  id: string;
  /** Slot from the template (e.g. "Pre-game", "Main", "Late") */
  slot: string;
  name: string;
  /** Short type/category label (e.g. "Cocktail bar") */
  type: string;
  /** HH:MM 12h time */
  time: string;
  area?: string;
  /** Why this venue was chosen — shown in the boarding pass */
  rationale: string;
  venueId?: string;
  lat?: number;
  lng?: number;
  priceLevel?: 1 | 2 | 3 | 4;
};

export type BonusMove = {
  name: string;
  /** e.g. "20-minute harbor walk before dinner" */
  reason: string;
  time?: string;
};

export type GeneratedPlan = {
  /** Themed Boarding Pass name, e.g. "Salsa, Skylines & Secrets" */
  experienceName: string;
  /** One-line tagline */
  experienceTagline: string;
  city: string;
  occasionLabel: string;
  vibeLabel: string;
  blueprint: string;
  stops: PlanStop[];
  bonus?: BonusMove;
  /** Estimated per-person spend, e.g. "$60–$90" */
  estimatedSpend: string;
  /** 0-1, how well the picks fit the request */
  fitScore: number;
  /** Short note from the Quality Guardrail agent */
  guardrailNote?: string;
};
