import { NextResponse } from "next/server";
import { getBotEnv } from "@/lib/bot/env";
import { runMomentumBotOnce } from "@/lib/bot/runner";

// Kita pakai "force-dynamic" agar Vercel tidak menyimpan cache (selalu ambil harga terbaru)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Ganti POST menjadi GET agar bisa dipanggil lewat browser/link langsung
export async function GET(req: Request) {
  console.log("=== MEMULAI ANALISA BOT ===");

  try {
    // 1. Validasi Environment (Token, Chat ID, API Keys)
    const env = getBotEnv();
    console.log("Env Validated:", { 
      hasToken: !!env.TELEGRAM_BOT_TOKEN, 
      hasChatId: !!env.MY_CHAT_ID 
    });

    // 2. Jalankan Logika Utama (Ambil Harga -> Tanya Claude -> Kirim Telegram)
    // Fungsi ini memanggil logic yang ada di file runner.ts kamu
    const result = await runMomentumBotOnce();

    console.log("Bot Run Success:", result);

    return NextResponse.json({
      success: true,
      message: "Bot berhasil dijalankan!",
      timestamp: new Date().toISOString(),
      details: result
    }, { status: 200 });

  } catch (e) {
    console.error("BOT ERROR:", e);
    
    // Jika error, kita kirim detailnya ke browser agar mudah di-debug
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : "Terjadi kesalahan tidak dikenal",
      stack: e instanceof Error ? e.stack : undefined
    }, { status: 500 });
  }
}