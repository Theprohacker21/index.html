const express = require('express');
const path = require('path');
const got = require('got');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the static frontend
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Basic HTML rewriting proxy:
 * - For text/html responses we rewrite links (href/src/action) to route through /proxy?url=<absolute-url>
 * - For non-HTML responses we stream them back with appropriate Content-Type
 *
 * WARNING: This is a simple educational proxy. It will not correctly handle every site (complex CSP, websockets,
 * auth flows, streaming, or sites that rely on same-origin scripting). Do NOT use this for evading policies,
 * authentication bypass, or illegal activity.
 */
app.get('/proxy', async (req, res) => {
  const target = req.query.url;
  if (!target) {
    return res.status(400).send('Missing url parameter. Example: /proxy?url=https://example.com');
  }

  // Basic validation
  try {
    new URL(target);
  } catch (err) {
    return res.status(400).send('Invalid url parameter');
  }

  try {
    const response = await got(target, {
      throwHttpErrors: false,
      responseType: 'buffer',
      headers: {
        // Spoof a common user-agent so some sites return desktop content.
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (compatible)'
      }
    });

    const contentType = (response.headers['content-type'] || '').toLowerCase();

    // If HTML, rewrite resource links so they route through this proxy
    if (contentType.includes('text/html')) {
      const html = response.body.toString('utf8');
      const $ = cheerio.load(html, { decodeEntities: false });

      // Helper to rewrite attribute values to proxied absolute URLs
      function rewriteAttr(selector, attr) {
        $(selector).each((i, el) => {
          const $el = $(el);
          const val = $el.attr(attr);
          if (!val) return;
          try {
            const abs = new URL(val, target).toString();
            $el.attr(attr, '/proxy?url=' + encodeURIComponent(abs));
          } catch (e) {
            // ignore invalid URLs
          }
        });
      }

      // Rewrite common attributes
      rewriteAttr('a', 'href');
      rewriteAttr('img', 'src');
      rewriteAttr('script', 'src');
      rewriteAttr('link', 'href');
      rewriteAttr('iframe', 'src');
      rewriteAttr('source', 'src');
      rewriteAttr('video', 'src');
      rewriteAttr('audio', 'src');
      rewriteAttr('form', 'action');

      // Add a <base> so relative paths inside the document resolve — but also we've rewritten many resources.
      if ($('head base').length === 0) {
        $('head').prepend(`<base href="${target}">`);
      }

      // Strip or relax CSP meta tags that would prevent the page from loading inside our iframe.
      $('meta[http-equiv="Content-Security-Policy"]').remove();

      // Return the modified HTML
      res.set('Content-Type', 'text/html; charset=utf-8');
      // Prevent browsers from blocking this proxied response with X-Frame-Options
      // We control this response so we just don't set it.
      return res.send($.html());
    }

    // For non-HTML (images, css, js, etc.) stream them back with original content-type
    const ct = response.headers['content-type'];
    if (ct) res.set('Content-Type', ct);
    if (response.headers['content-length']) res.set('Content-Length', response.headers['content-length']);
    // Forward cache headers if present
    if (response.headers['cache-control']) res.set('Cache-Control', response.headers['cache-control']);

    return res.send(response.body);
  } catch (err) {
    console.error('Proxy error', err);
    return res.status(502).send('Error fetching target URL.');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Chrome-like proxy running at http://localhost:${PORT}`);
  console.log('Open the UI at /');
});
