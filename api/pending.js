/**
 * GET /api/pending
 * HF Space опрашивает этот endpoint раз в N секунд.
 * Возвращает все накопленные updates и очищает очередь.
 * Вызов занимает ~100ms (нет ожидания) — Fluid Memory/CPU минимальны.
 *
 * Безопасность: простой заголовок X-Pending-Secret.
 */
const { Redis } = require("@upstash/redis");

const KV_KEY = "tg_updates";

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json([]);
  }

  // Проверка секрета
  const secret = process.env.WEBHOOK_SECRET || "";
  if (secret) {
    const incoming = req.headers["x-pending-secret"] || "";
    if (incoming !== secret) {
      return res.status(403).json([]);
    }
  }

  const redis = Redis.fromEnv();
  const raw = await redis.lrange(KV_KEY, 0, -1);
  if (raw.length > 0) {
    await redis.del(KV_KEY);
  }

  // KV может вернуть уже распарсенные объекты или строки — обрабатываем оба случая
  const updates = raw.map(item =>
    typeof item === "string" ? JSON.parse(item) : item
  );

  res.setHeader("Content-Type", "application/json");
  return res.status(200).json(updates);
};
