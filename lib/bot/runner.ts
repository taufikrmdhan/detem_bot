import { getBotEnv } from "./env";
import { rankUniverseByMomentum } from "./momentum";
import { appendLogLine, readStateOrInit, writeState } from "./storage";
import { sendTelegramMessage } from "./telegram";
import { fetchCandlesFromTwelveData } from "./twelvedata";
import type { BotRunResult, BotState } from "./types";

function parseUniverse(raw: string) {
  return raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

function fmtPct(x: number) {
  const sign = x > 0 ? "+" : "";
  return `${sign}${x.toFixed(2)}%`;
}

function nowIso() {
  return new Date().toISOString();
}

function canBuyMore(state: BotState, maxPositions: number) {
  return Object.keys(state.positions).length < maxPositions;
}

export async function runMomentumBotOnce(): Promise<BotRunResult> {
  const env = getBotEnv();
  const universe = parseUniverse(env.BOT_UNIVERSE);

  const state = await readStateOrInit({ mode: env.BOT_MODE });
  const candlesBySymbol: Record<string, Awaited<ReturnType<typeof fetchCandlesFromTwelveData>>> =
    {};

  const actions: BotRunResult["actions"] = [];

  // Fetch candles (simple sequential to avoid rate limit surprises).
  for (const symbol of universe) {
    try {
      candlesBySymbol[symbol] = await fetchCandlesFromTwelveData({
        apiKey: env.TWELVE_DATA_KEY,
        symbol,
        interval: env.BOT_INTERVAL,
        outputsize: env.BOT_OUTPUTSIZE,
      });
    } catch (e) {
      actions.push({
        type: "SKIP",
        symbol,
        reason: e instanceof Error ? e.message : "fetch failed",
      });
    }
  }

  const ranked = rankUniverseByMomentum({
    universe,
    candlesBySymbol,
    lookbackBars: env.BOT_LOOKBACK_BARS,
  });

  // SELL rules: if holding but momentum drops below sell threshold.
  for (const [symbol, pos] of Object.entries(state.positions)) {
    const s = ranked.find((r) => r.symbol === symbol);
    const lastClose = s?.lastClose;
    const scorePct = s?.scorePct;
    if (!lastClose || scorePct === undefined) {
      actions.push({ type: "HOLD", symbol, reason: "no fresh data" });
      continue;
    }
    if (scorePct <= env.BOT_SELL_THRESHOLD_PCT) {
      // paper sell at lastClose
      const proceeds = pos.qty * lastClose;
      state.cashUsd += proceeds;
      delete state.positions[symbol];
      actions.push({
        type: "SELL",
        symbol,
        qty: pos.qty,
        price: lastClose,
        reason: `momentum ${fmtPct(scorePct)} <= sell ${fmtPct(env.BOT_SELL_THRESHOLD_PCT)}`,
      });
    } else {
      actions.push({
        type: "HOLD",
        symbol,
        reason: `momentum ${fmtPct(scorePct)} ok`,
      });
    }
  }

  // BUY rules: buy top momentum names above threshold, up to max positions.
  for (const r of ranked) {
    if (!canBuyMore(state, env.BOT_MAX_POSITIONS)) break;
    if (state.positions[r.symbol]) continue;
    if (r.scorePct < env.BOT_BUY_THRESHOLD_PCT) continue;
    if (state.cashUsd < env.BOT_POSITION_USD) {
      actions.push({ type: "SKIP", symbol: r.symbol, reason: "insufficient cash" });
      continue;
    }
    const qty = env.BOT_POSITION_USD / r.lastClose;
    if (!Number.isFinite(qty) || qty <= 0) continue;
    state.cashUsd -= env.BOT_POSITION_USD;
    state.positions[r.symbol] = {
      symbol: r.symbol,
      qty,
      entryPrice: r.lastClose,
      entryAt: nowIso(),
    };
    actions.push({
      type: "BUY",
      symbol: r.symbol,
      qty,
      price: r.lastClose,
      reason: `top momentum ${fmtPct(r.scorePct)} >= buy ${fmtPct(env.BOT_BUY_THRESHOLD_PCT)}`,
    });
  }

  state.updatedAt = nowIso();
  await writeState(state);

  const result: BotRunResult = {
    ranAt: nowIso(),
    universe,
    interval: env.BOT_INTERVAL,
    lookbackBars: env.BOT_LOOKBACK_BARS,
    ranked: ranked.slice(0, 20),
    actions,
    state,
  };

  await appendLogLine(result);

  const summaryBuys = actions.filter((a) => a.type === "BUY") as Array<
    Extract<BotRunResult["actions"][number], { type: "BUY" }>
  >;
  const summarySells = actions.filter((a) => a.type === "SELL") as Array<
    Extract<BotRunResult["actions"][number], { type: "SELL" }>
  >;

  const summaryText =
    `Detem momentum bot (${env.BOT_MODE}) @ ${result.ranAt}\n` +
    `Universe: ${universe.length} | Interval: ${env.BOT_INTERVAL} | Lookback: ${env.BOT_LOOKBACK_BARS}\n` +
    `Top: ${ranked
      .slice(0, 5)
      .map((x) => `${x.symbol} ${fmtPct(x.scorePct)}`)
      .join(", ")}\n` +
    `BUY: ${summaryBuys.length ? summaryBuys.map((b) => b.symbol).join(", ") : "-"}\n` +
    `SELL: ${summarySells.length ? summarySells.map((s) => s.symbol).join(", ") : "-"}\n` +
    `Cash: $${state.cashUsd.toFixed(2)} | Positions: ${Object.keys(state.positions).length}`;

  try {
    await sendTelegramMessage({
      token: env.TELEGRAM_BOT_TOKEN,
      chatId: env.MY_CHAT_ID,
      text: summaryText,
    });
  } catch (e) {
    // Notifications are best-effort; don't fail trading loop.
    console.warn("[telegram] failed:", e instanceof Error ? e.message : e);
  }

  return result;
}

