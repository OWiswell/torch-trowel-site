import { json } from "../lib/db.js";

const isAuthorized = (request, env) => {
  const token = env.ANALYTICS_API_TOKEN || env.TRACKER_API_TOKEN;
  if (!token) return false;
  return request.headers.get("authorization") === `Bearer ${token}`;
};

const safeDays = (url) => {
  const days = Number(new URL(url).searchParams.get("days") || 30);
  return [7, 30, 90].includes(days) ? days : 30;
};

const eventCounts = async (env, since) => {
  const result = await env.DB.prepare(`
    SELECT event_name, COUNT(*) AS total
    FROM analytics_events
    WHERE created_at >= ?
    GROUP BY event_name
  `).bind(since).all();
  return Object.fromEntries((result.results || []).map((row) => [row.event_name, Number(row.total || 0)]));
};

const pathCounts = async (env, since) => {
  const result = await env.DB.prepare(`
    SELECT path, COUNT(*) AS total
    FROM analytics_events
    WHERE event_name = 'page_view' AND created_at >= ?
    GROUP BY path
    ORDER BY total DESC
    LIMIT 20
  `).bind(since).all();
  return result.results || [];
};

const sourceCounts = async (env, since) => {
  const result = await env.DB.prepare(`
    SELECT
      COALESCE(NULLIF(json_extract(detail, '$.utmSource'), ''), NULLIF(json_extract(detail, '$.referrerHost'), ''), 'Direct / unknown') AS source,
      COUNT(*) AS total
    FROM analytics_events
    WHERE event_name = 'page_view' AND created_at >= ?
    GROUP BY source
    ORDER BY total DESC
    LIMIT 12
  `).bind(since).all();
  return result.results || [];
};

const subscriberCount = async (env, since) => {
  const row = await env.DB.prepare(`
    SELECT COUNT(*) AS total FROM subscribers WHERE subscribed_at >= ?
  `).bind(since).first();
  return Number(row?.total || 0);
};

const rate = (numerator, denominator) => denominator ? Number(((numerator / denominator) * 100).toFixed(1)) : 0;

const pathTotal = (paths, variants) => variants.reduce((total, variant) => {
  const row = paths.find((pathRow) => pathRow.path === variant);
  return total + Number(row?.total || 0);
}, 0);

const sumEvents = (events, names) => names.reduce((total, name) => total + Number(events[name] || 0), 0);

export const onRequestGet = async ({ request, env }) => {
  if (!isAuthorized(request, env)) return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!env.DB) return json({ ok: false, error: "Cloudflare D1 binding DB is not configured" }, { status: 500 });

  const days = safeDays(request.url);
  const sinceDate = new Date(Date.now() - days * 86400000);
  const since = sinceDate.toISOString();
  const [events, paths, sources, subscribers] = await Promise.all([
    eventCounts(env, since),
    pathCounts(env, since),
    sourceCounts(env, since),
    subscriberCount(env, since)
  ]);

  const visits = events.page_view || 0;
  const freeLessonViews = pathTotal(paths, ["/free-drawing-lesson", "/free-drawing-lesson.html"]);
  const sampleViews = pathTotal(paths, ["/free-sample-v1", "/free-sample-v1.html"]);
  const productViews = pathTotal(paths, ["/drawing-field-kit", "/drawing-field-kit.html"]);
  const formStarts = events.start_lead_form || 0;
  const formSubmits = events.server_submit_lead_form || events.submit_lead_form || subscribers;
  const downloads = events.download_free_sample || 0;
  const buyClicks = sumEvents(events, ["click_buy_now", "click_sticky_buy_now", "click_home_buy_now"]);
  const productClicks = sumEvents(events, ["click_view_product", "click_home_product_preview", "click_nav_buy_kit"]);
  const freeLessonClicks = sumEvents(events, ["click_nav_free_lesson", "click_free_lesson_cta", "click_sticky_free_lesson", "click_article_free_lesson", "click_testimonial_free_lesson"]);
  const purchases = events.purchase_completed || 0;

  return json({
    ok: true,
    generatedAt: new Date().toISOString(),
    days,
    counts: { visits, freeLessonClicks, freeLessonViews, formStarts, formSubmits, subscribers, sampleViews, downloads, productClicks, productViews, buyClicks, purchases },
    rates: {
      visitToFreeLessonClick: rate(freeLessonClicks, visits),
      visitToFreeLesson: rate(freeLessonViews, visits),
      freeLessonToFormStart: rate(formStarts, freeLessonViews),
      formCompletion: rate(formSubmits, formStarts),
      leadToSampleView: rate(sampleViews, formSubmits),
      sampleViewToDownload: rate(downloads, sampleViews),
      sampleViewToProductClick: rate(productClicks, sampleViews),
      leadToProductView: rate(productViews, formSubmits),
      productToBuyClick: rate(buyClicks, productViews),
      buyClickToPurchase: rate(purchases, buyClicks),
      leadToPurchase: rate(purchases, formSubmits)
    },
    paths,
    sources,
    events
  });
};
