import { html, nowIso } from "../lib/db.js";

const page = (title, message) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <style>
      body { font-family: ui-serif, Georgia, serif; margin: 0; padding: 48px 24px; color: #30271f; background: #f7f1e8; }
      main { max-width: 620px; margin: 0 auto; }
      a { color: #6f3f28; }
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>${message}</p>
      <p><a href="/">Return to Torch &amp; Trowel</a></p>
    </main>
  </body>
</html>`;

export const onRequestGet = async ({ request, env }) => {
  if (!env.DB) {
    return html(page("Unable to unsubscribe", "The email database is not configured yet."), { status: 500 });
  }

  const url = new URL(request.url);
  const token = String(url.searchParams.get("token") || "").trim();
  if (!token) {
    return html(page("Unable to unsubscribe", "This unsubscribe link is missing its token."), { status: 400 });
  }

  const result = await env.DB.prepare(`
    UPDATE subscribers
    SET status = 'unsubscribed', unsubscribed_at = ?, updated_at = ?
    WHERE unsubscribe_token = ?
  `).bind(nowIso(), nowIso(), token).run();

  if (!result.meta?.changes) {
    return html(page("Already handled", "We could not find an active subscription for this link."), { status: 404 });
  }

  return html(page("You are unsubscribed", "You will no longer receive Torch & Trowel nurture emails."));
};
