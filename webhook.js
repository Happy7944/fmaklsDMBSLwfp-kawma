/**
 * POST /api/webhook
 * Telegram вызывает этот endpoint при каждом новом update (кнопка, команда).
 * Сохраняем update в Vercel KV — HF Space заберёт через /api/pending.
 *
 * Безопасность: Telegram передаёт WEBHOOK_SECRET в заголовке
 * X-Telegram-Bot-Api-Secret-Token — неизвестный не пройдёт.
 */
const { Redis } = require("@upstash/redis");

const KV_KEY   = "tg_updates";
const MAX_ITEMS = 100; // защита от разрастания очереди

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  // Проверка секрета
  const secret = process.env.WEBHOOK_SECRET || "";
  if (secret) {
    const incoming = req.headers["x-telegram-bot-api-secret-token"] || "";
    if (incoming !== secret) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }
  }

  const update = req.body;
  if (update && update.update_id) {
    const redis = Redis.fromEnv();
    await redis.rpush(KV_KEY, JSON.stringify(update));
    await redis.ltrim(KV_KEY, -MAX_ITEMS, -1);
  }

  return res.status(200).json({ ok: true });
};
