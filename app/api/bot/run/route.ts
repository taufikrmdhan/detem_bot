import { NextResponse } from "next/server";
import { getBotEnv } from "@/lib/bot/env";
import { runMomentumBotOnce } from "@/lib/bot/runner";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const env = getBotEnv();
  const secret = req.headers.get("x-bot-secret");
  if (!secret || secret !== env.BOT_RUN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runMomentumBotOnce();
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown error" },
      { status: 500 },
    );
  }
}

