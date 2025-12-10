export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing url");

  try {
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    res.setHeader("Content-Type", response.headers.get("content-type") || "text/plain");
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
}

