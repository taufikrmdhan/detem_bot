import { NextResponse } from "next/server";
import { getBotEnv, getBotRunSecret } from "@/lib/bot/env";
import { readLastLogLines, readStateOrInit } from "@/lib/bot/storage";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const env = getBotEnv();
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

  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") ?? "50")));
  const state = await readStateOrInit({ mode: env.BOT_MODE });
  const logs = await readLastLogLines(limit);
  return NextResponse.json({ state, logs }, { status: 200 });
}

