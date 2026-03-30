export type Candle = {
  datetime: string;
  close: number;
};

export type MomentumScore = {
  symbol: string;
  scorePct: number;
  lastClose: number;
};

export type BotPosition = {
  symbol: string;
  qty: number;
  entryPrice: number;
  entryAt: string;
};

export type BotState = {
  updatedAt: string;
  mode: "paper" | "live";
  cashUsd: number;
  positions: Record<string, BotPosition>;
};

export type BotRunResult = {
  ranAt: string;
  universe: string[];
  interval: string;
  lookbackBars: number;
  ranked: MomentumScore[];
  actions: Array<
    | { type: "BUY"; symbol: string; qty: number; price: number; reason: string }
    | { type: "SELL"; symbol: string; qty: number; price: number; reason: string }
    | { type: "HOLD"; symbol: string; reason: string }
    | { type: "SKIP"; symbol: string; reason: string }
  >;
  state: BotState;
};

