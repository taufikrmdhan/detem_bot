import "dotenv/config";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { runMomentumBotOnce } from "@/lib/bot/runner";

// Load Next-style env file for CLI usage.
loadDotenv({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  const result = await runMomentumBotOnce();
  // Keep output compact for terminal usage.
  console.log(
    JSON.stringify(
      {
        ranAt: result.ranAt,
        actions: result.actions,
        cashUsd: result.state.cashUsd,
        positions: Object.keys(result.state.positions),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

