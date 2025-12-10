export default async function handler(req, res) {
  const target = req.query.url;
  if (!target) return res.status(400).send("Missing url");

  try {
    const resp = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      }
    });

    res.setHeader("Content-Type", resp.headers.get("content-type") || "text/plain");
    const buf = await resp.arrayBuffer();
    res.send(Buffer.from(buf));
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
}
