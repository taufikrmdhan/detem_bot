import { promises as fs } from "node:fs";
import path from "node:path";
import type { BotState } from "./types";

const dataDir = path.join(process.cwd(), "data");
const statePath = path.join(dataDir, "state.json");
const logPath = path.join(dataDir, "bot-log.jsonl");

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

export async function readStateOrInit(args: {
  mode: "paper" | "live";
  startingCashUsd?: number;
}): Promise<BotState> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(statePath, "utf8");
    const parsed = JSON.parse(raw) as BotState;
    if (parsed && typeof parsed === "object" && parsed.positions) return parsed;
  } catch {
    // ignore
  }
  const now = new Date().toISOString();
  const state: BotState = {
    updatedAt: now,
    mode: args.mode,
    cashUsd: args.startingCashUsd ?? 10_000,
    positions: {},
  };
  await writeState(state);
  return state;
}

export async function writeState(state: BotState) {
  await ensureDataDir();
  await fs.writeFile(statePath, JSON.stringify(state, null, 2), "utf8");
}

export async function appendLogLine(obj: unknown) {
  await ensureDataDir();
  await fs.appendFile(logPath, `${JSON.stringify(obj)}\n`, "utf8");
}

export async function readLastLogLines(limit: number): Promise<string[]> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(logPath, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    return lines.slice(Math.max(0, lines.length - limit));
  } catch {
    return [];
  }
}

