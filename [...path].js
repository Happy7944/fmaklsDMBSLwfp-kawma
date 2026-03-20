// Vercel Serverless Function — Telegram API Proxy
// Маршрут: /bot{token}/{method} → api.telegram.org/bot{token}/{method}

export default async function handler(req, res) {
  const { path } = req.query;
  const pathStr = Array.isArray(path) ? path.join("/") : path || "";

  // Healthcheck
  if (!pathStr.startsWith("bot")) {
    return res.status(200).send("Telegram API Proxy — OK");
  }

  const tgUrl = `https://api.telegram.org/${pathStr}${
    req.url.includes("?") ? "?" + req.url.split("?")[1] : ""
  }`;

  try {
    const fetchOptions = {
      method: req.method,
      headers: { "Content-Type": "application/json" },
    };

    if (req.method !== "GET" && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const tgRes = await fetch(tgUrl, fetchOptions);
    const data  = await tgRes.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    return res.status(tgRes.status).json(data);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
