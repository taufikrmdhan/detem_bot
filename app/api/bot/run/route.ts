import { NextResponse } from "next/server";
import { getBotEnv, getBotRunSecret } from "@/lib/bot/env";
import { runMomentumBotOnce } from "@/lib/bot/runner";

export const runtime = "nodejs";

export async function POST(req: Request) {
  getBotEnv(); // validate other bot env
  let expectedSecret: string;
  try {
    expectedSecret = getBotRunSecret();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "BOT_RUN_SECRET missing" },
      { status: 500 },
    );
  }
  const secret = req.headers.get("x-bot-secret");
  if (!secret || secret !== expectedSecret) {
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

