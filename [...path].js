// api/[...path].js
// Handles: /bot{token}/{method} → api.telegram.org/bot{token}/{method}

module.exports = async function handler(req, res) {
  const parts = req.query.path; // array: ["bot123:TOKEN", "sendMessage"]
  const pathStr = Array.isArray(parts) ? parts.join("/") : String(parts || "");

  if (!pathStr.startsWith("bot")) {
    res.setHeader("Content-Type", "text/plain");
    return res.status(200).send("Telegram API Proxy — OK");
  }

  // Reconstruct query string (excluding Vercel's internal "path" param)
  const qs = Object.entries(req.query)
    .filter(([k]) => k !== "path")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

  const tgUrl = `https://api.telegram.org/${pathStr}${qs ? "?" + qs : ""}`;

  try {
    const fetchOptions = {
      method: req.method || "POST",
      headers: { "Content-Type": "application/json" },
    };

    if (req.method !== "GET" && req.body) {
      fetchOptions.body = typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body);
    }

    const tgRes = await fetch(tgUrl, fetchOptions);
    const data = await tgRes.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    return res.status(tgRes.status).json(data);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
