export async function sendTelegramMessage(args: {
  token?: string;
  chatId?: string;
  text: string;
}) {
  if (!args.token || !args.chatId) return;
  const url = new URL(`https://api.telegram.org/bot${args.token}/sendMessage`);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: args.chatId,
      text: args.text,
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram sendMessage failed: ${res.status} ${body}`);
  }
}

