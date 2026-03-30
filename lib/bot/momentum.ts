import type { Candle, MomentumScore } from "./types";

export function computeMomentumScorePct(candles: Candle[], lookbackBars: number) {
  if (candles.length < lookbackBars + 1) return null;
  const last = candles[candles.length - 1]!;
  const past = candles[candles.length - 1 - lookbackBars]!;
  if (!Number.isFinite(last.close) || !Number.isFinite(past.close) || past.close <= 0)
    return null;
  const scorePct = ((last.close - past.close) / past.close) * 100;
  return { scorePct, lastClose: last.close };
}

export function rankUniverseByMomentum(args: {
  universe: string[];
  candlesBySymbol: Record<string, Candle[]>;
  lookbackBars: number;
}): MomentumScore[] {
  const ranked: MomentumScore[] = [];
  for (const symbol of args.universe) {
    const candles = args.candlesBySymbol[symbol];
    if (!candles) continue;
    const score = computeMomentumScorePct(candles, args.lookbackBars);
    if (!score) continue;
    ranked.push({ symbol, scorePct: score.scorePct, lastClose: score.lastClose });
  }
  ranked.sort((a, b) => b.scorePct - a.scorePct);
  return ranked;
}

