import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

const app = express();
app.use(cors());
app.use(express.json());

let browser;

// Launch browser once and reuse
async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage"
      ]
    });
  }
  return browser;
}

app.get("/proxy", async (req, res) => {
  const url = req.query.url;
  const cookiesHeader = req.headers["x-client-cookies"] || "[]";

  if (!url) return res.status(400).send("Missing ?url=");

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    // Load existing cookies
    try {
      const cookies = JSON.parse(cookiesHeader);
      if (Array.isArray(cookies)) {
        for (const c of cookies) await page.setCookie(c);
      }
    } catch {}

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    const html = await page.content();
    const newCookies = await page.cookies();

    res.setHeader("x-server-cookies", JSON.stringify(newCookies));
    res.setHeader("Access-Control-Expose-Headers", "x-server-cookies");
    res.send(html);

    await page.close();
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Proxy error: " + err.message);
  }
});

app.use(express.static("./"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Scramjet server running on port", PORT));
