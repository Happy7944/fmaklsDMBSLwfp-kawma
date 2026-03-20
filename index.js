module.exports = async function handler(req, res) {
  // req.url может быть /api/bot.../method или /bot.../method — срезаем оба варианта
  const rawPath = req.url.split("?")[0].replace(/^\/+(api\/)?/, "");

  if (!rawPath.startsWith("bot")) {
    res.setHeader("Content-Type", "text/plain");
    return res.status(200).send("Telegram API Proxy — OK");
  }

  const tgUrl = "https://api.telegram.org/" + rawPath;

  try {
    const opts = {
      method: req.method || "POST",
      headers: { "Content-Type": "application/json" },
    };
    if (req.method !== "GET" && req.body) {
      opts.body = typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body);
    }

    const tgRes = await fetch(tgUrl, opts);
    const data  = await tgRes.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    return res.status(tgRes.status).json(data);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
