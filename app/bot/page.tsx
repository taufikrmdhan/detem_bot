export const runtime = "nodejs";

function getBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  return "http://localhost:3000";
}

async function fetchStatus() {
  const secret = process.env.BOT_RUN_SECRET;
  if (!secret || secret.length < 12) {
    throw new Error("BOT_RUN_SECRET is not set (min 12 chars).");
  }
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/bot/status?limit=30`, {
    headers: {
      "x-bot-secret": secret,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`status ${res.status}: ${txt}`);
  }
  return (await res.json()) as {
    state: {
      updatedAt: string;
      mode: string;
      cashUsd: number;
      positions: Record<string, { qty: number; entryPrice: number; entryAt: string }>;
    };
    logs: string[];
  };
}

export default async function BotPage() {
  let data: Awaited<ReturnType<typeof fetchStatus>> | null = null;
  let error: string | null = null;
  try {
    data = await fetchStatus();
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
              Dashboard butuh <code className="font-mono">BOT_RUN_SECRET</code> supaya bisa
              memanggil <code className="font-mono">/api/bot/status</code>.
            </p>
            <pre className="mt-3 text-xs overflow-auto rounded-xl bg-black/[.03] dark:bg-white/[.06] p-3">
              {error ?? "No data"}
            </pre>
            <p className="mt-3 text-sm">
              Tambahkan ke <code className="font-mono">.env.local</code>:
            </p>
            <pre className="mt-2 text-xs overflow-auto rounded-xl bg-black/[.03] dark:bg-white/[.06] p-3">
              BOT_RUN_SECRET=your-long-random-secret
            </pre>
            <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
              Setelah itu restart <code className="font-mono">npm run dev</code>.
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
            Endpoint ini butuh header <code className="font-mono">x-bot-secret</code>.
            Dashboard akan jalan di local dev (server-side fetch pakai env).
          </p>
        </div>
      </div>
    </div>
  );
}

