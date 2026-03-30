export const runtime = "nodejs";

import { getBotEnv } from "@/lib/bot/env";
import { readLastLogLines, readStateOrInit } from "@/lib/bot/storage";

export default async function BotPage() {
  let data:
    | {
        state: {
          updatedAt: string;
          mode: string;
          cashUsd: number;
          positions: Record<string, { qty: number; entryPrice: number; entryAt: string }>;
        };
        logs: string[];
      }
    | null = null;
  let error: string | null = null;
  try {
    const env = getBotEnv();
    const state = await readStateOrInit({ mode: env.BOT_MODE });
    const logs = await readLastLogLines(30);
    data = { state, logs };
  } catch (e) {
    error = e instanceof Error ? e.message : "unknown error";
  }

  if (!data) {
    return (
      <div className="flex flex-1 items-start justify-center bg-zinc-50 dark:bg-black px-6 py-10">
        <div className="w-full max-w-2xl space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">Detem Bot</h1>
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 p-5">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Dashboard gagal membaca state/log bot.
            </p>
            <pre className="mt-3 text-xs overflow-auto rounded-xl bg-black/[.03] dark:bg-white/[.06] p-3">
              {error ?? "No data"}
            </pre>
            <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
              Pastikan env seperti <code className="font-mono">TWELVE_DATA_KEY</code> sudah
              diset, dan bot sudah pernah dijalankan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const positions = Object.entries(data.state.positions);

  return (
    <div className="flex flex-1 items-start justify-center bg-zinc-50 dark:bg-black px-6 py-10">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Detem Bot</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Updated: {new Date(data.state.updatedAt).toLocaleString()} • Mode:{" "}
              <span className="font-medium">{data.state.mode}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Cash</div>
            <div className="text-xl font-semibold">${data.state.cashUsd.toFixed(2)}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 p-5">
          <h2 className="text-lg font-semibold">Positions</h2>
          {positions.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">No positions.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-zinc-600 dark:text-zinc-400">
                  <tr>
                    <th className="py-2 pr-4">Symbol</th>
                    <th className="py-2 pr-4">Qty</th>
                    <th className="py-2 pr-4">Entry</th>
                    <th className="py-2 pr-4">Entry time</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map(([symbol, p]) => (
                    <tr key={symbol} className="border-t border-black/5 dark:border-white/10">
                      <td className="py-2 pr-4 font-medium">{symbol}</td>
                      <td className="py-2 pr-4">{p.qty.toFixed(6)}</td>
                      <td className="py-2 pr-4">${p.entryPrice.toFixed(2)}</td>
                      <td className="py-2 pr-4">
                        {new Date(p.entryAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 p-5">
          <h2 className="text-lg font-semibold">Recent logs</h2>
          <pre className="mt-3 text-xs overflow-auto max-h-[420px] rounded-xl bg-black/[.03] dark:bg-white/[.06] p-3">
            {data.logs.join("\n")}
          </pre>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            Endpoint bot masih butuh header <code className="font-mono">x-bot-secret</code>,
            tapi dashboard tidak memanggil endpoint tersebut (biar tidak kena Vercel
            protection).
          </p>
        </div>
      </div>
    </div>
  );
}

