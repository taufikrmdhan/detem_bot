import { z } from "zod";

const envSchema = z.object({
  TWELVE_DATA_KEY: z.string().min(1),
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  MY_CHAT_ID: z.string().min(1).optional(),
  BOT_UNIVERSE: z.string().min(1).default("AAPL,MSFT,NVDA,TSLA"),
  BOT_INTERVAL: z.string().min(1).default("1h"),
  BOT_OUTPUTSIZE: z.coerce.number().int().min(50).max(5000).default(300),
  BOT_LOOKBACK_BARS: z.coerce.number().int().min(5).max(2000).default(48),
  BOT_CRON: z.string().min(1).default("0 * * * *"),
  BOT_BUY_THRESHOLD_PCT: z.coerce.number().min(0).max(100).default(2),
  BOT_SELL_THRESHOLD_PCT: z.coerce.number().min(-100).max(100).default(0.5),
  BOT_POSITION_USD: z.coerce.number().positive().default(100),
  BOT_MAX_POSITIONS: z.coerce.number().int().min(1).max(50).default(3),
  BOT_MODE: z.enum(["paper", "live"]).default("paper"),
});

export type BotEnv = z.infer<typeof envSchema>;

export function getBotEnv(): BotEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid bot env:\n${message}`);
  }
  return parsed.data;
}

const botRunSecretSchema = z.string().min(12);

export function getBotRunSecret(): string {
  const raw = process.env.BOT_RUN_SECRET;
  const parsed = botRunSecretSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("BOT_RUN_SECRET is not set (min 12 chars).");
  }
  return parsed.data;
}

