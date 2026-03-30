import path from "node:path";
import { config as loadDotenv } from "dotenv";
import cron from "node-cron";
import { getBotEnv } from "@/lib/bot/env";
import { runMomentumBotOnce } from "@/lib/bot/runner";

loadDotenv({ path: path.join(process.cwd(), ".env.local") });

async function tick() {
  try {
    const result = await runMomentumBotOnce();
    console.log(`[bot] ranAt=${result.ranAt} actions=${result.actions.length}`);
  } catch (e) {
    console.error("[bot] error", e);
  }
}

async function main() {
  const env = getBotEnv();
  console.log(`[bot] daemon started cron="${env.BOT_CRON}" mode=${env.BOT_MODE}`);
  await tick();
  cron.schedule(env.BOT_CRON, tick, { timezone: "UTC" });
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

