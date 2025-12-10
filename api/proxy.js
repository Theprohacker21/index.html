import chromium from "chrome-aws-lambda";

export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing url");

  let browser = null;

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    const html = await page.content();
    res.setHeader("Content-Type", "text/html");
    res.send(html);

  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error: " + err.message);
  } finally {
    if (browser) await browser.close();
  }
}

export const config = { api: { bodyParser: false } };
