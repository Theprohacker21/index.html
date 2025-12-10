import httpProxy from 'http-proxy';

const proxy = httpProxy.createProxyServer({ changeOrigin: true, secure: false });

export default function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("Missing url");

  // rewrite headers for Vercel serverless
  req.headers.host = new URL(targetUrl).host;

  proxy.web(req, res, { target: targetUrl }, err => {
    console.error(err);
    res.status(500).send("Proxy error: " + err.message);
  });
}

// Prevent Vercel cold-start issues with CORS
export const config = { api: { bodyParser: false, externalResolver: true } };
