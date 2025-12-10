import chromium from "chrome-aws-lambda";

export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing url");

  let browser;

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true
    });

    const page = await browser.newPage();

    // Set a realistic user-agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    );

    // Navigate to the requested URL
    await page.goto(url, { waitUntil: "networkidle2", timeout: 10000 });

    // Return rendered HTML
    const html = await page.content();
    res.setHeader("Content-Type", "text/html");
    res.send(html);

  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Proxy error: " + err.message);
  } finally {
    if (browser) await browser.close();
  }
}

export const config = { api: { bodyParser: false } };
