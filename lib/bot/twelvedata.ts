import { z } from "zod";
import type { Candle } from "./types";

const timeSeriesSchema = z.object({
  status: z.string().optional(),
  code: z.coerce.number().optional(),
  message: z.string().optional(),
  values: z
    .array(
      z.object({
        datetime: z.string(),
        close: z.string(),
      }),
    )
    .optional(),
});

export async function fetchCandlesFromTwelveData(args: {
  apiKey: string;
  symbol: string;
  interval: string;
  outputsize: number;
}): Promise<Candle[]> {
  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", args.symbol);
  url.searchParams.set("interval", args.interval);
  url.searchParams.set("outputsize", String(args.outputsize));
  url.searchParams.set("apikey", args.apiKey);

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) {
    throw new Error(`TwelveData HTTP ${res.status} for ${args.symbol}`);
  }
  const json = await res.json();
  const parsed = timeSeriesSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`TwelveData invalid response for ${args.symbol}`);
  }
  if (!parsed.data.values?.length) {
    const msg = parsed.data.message ?? "no values";
    throw new Error(`TwelveData error for ${args.symbol}: ${msg}`);
  }

  // TwelveData returns newest-first; normalize oldest-first.
  const candles = parsed.data.values
    .map((v) => ({ datetime: v.datetime, close: Number(v.close) }))
    .filter((c) => Number.isFinite(c.close))
    .reverse();

  return candles;
}

