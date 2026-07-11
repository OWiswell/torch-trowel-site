# Analytics Setup

This site is ready for three Cloudflare-native measurement layers:

1. Cloudflare Web Analytics for pageviews, traffic sources, and performance.
2. Cloudflare Zaraz for custom funnel events such as CTA clicks, form starts, downloads, and buy-button clicks.
3. A lightweight D1 event log through `/api/track` for first-party funnel review without another subscription.

## Cloudflare Web Analytics

Use this for the basic question: "Which pages are people visiting, and how is the site performing?"

Recommended setup for Cloudflare Pages:

1. Open Cloudflare Dashboard.
2. Go to Workers & Pages.
3. Select the `torch-trowel-site` Pages project.
4. Open Metrics.
5. Enable Web Analytics.
6. Let Cloudflare automatically inject the beacon on the next deployment.

Do not manually paste a fake token into the site. Cloudflare can inject the correct beacon for Pages.

## Cloudflare Zaraz

Use this for the conversion question: "What actions are visitors taking?"

The site already calls `zaraz.track(eventName, eventProperties)` when Zaraz is present. It also sends the same event names to `dataLayer` and Plausible if those tools are added later.

## D1 Event Log

The same `trackConversionEvent` helper now posts to `/api/track`. When the Pages project has the `DB` D1 binding configured, events are stored in `analytics_events`.

Use this as the no-subscription baseline. Zaraz and Web Analytics are still useful for richer traffic reporting, but the D1 log is enough to answer whether visitors are moving through the sales funnel.

Core events currently emitted:

- `click_nav_free_lesson`
- `click_nav_buy_kit`
- `click_free_lesson_cta`
- `click_sticky_free_lesson`
- `click_buy_now`
- `click_sticky_buy_now`
- `click_view_product`
- `click_start_here`
- `click_curriculum_guide`
- `start_lead_form`
- `submit_lead_form`
- `open_pdf_preview`
- `download_free_sample`
- `download_product_files`

Recommended first dashboard:

- Free lesson CTA clicks
- Lead form starts
- Lead form submissions
- Free sample downloads
- Product page clicks
- Buy button clicks

Useful D1 query:

```sql
SELECT event_name, COUNT(*) AS total
FROM analytics_events
WHERE created_at >= datetime('now', '-7 days')
GROUP BY event_name
ORDER BY total DESC;
```

## First Questions To Answer

Do not optimize everything at once. Watch these five numbers first:

1. How many people click the free lesson CTA?
2. How many people start the form?
3. How many people submit the form?
4. How many people download the sample?
5. How many people click buy?

If form starts are high and submissions are low, improve the form.
If downloads are high and buy clicks are low, improve the thank-you page and product bridge.
If product views are high and buy clicks are low, improve objections, price clarity, and trust near the buy buttons.

## Private Funnel Dashboard

Open `/funnel-dashboard` to see the 7-, 30-, or 90-day funnel without running SQL manually. The dashboard reports page views, free-lesson visits, form starts, verified server-side submissions, downloads, product views, buy clicks, purchases, traffic sources, and top pages.

Set `ANALYTICS_API_TOKEN` as a Cloudflare Pages secret. If it is not set, the API accepts the existing `TRACKER_API_TOKEN` instead. The token is stored only in the current browser's local storage after it is entered.

Page views begin accumulating after the tracking script containing the `page_view` event is deployed. Older CTA and form events remain available, but old page-view conversion rates cannot be reconstructed.

## Stripe Purchase Confirmation

The `/api/stripe-webhook` endpoint records `purchase_completed` when Stripe sends a valid `checkout.session.completed` event.

1. In Stripe, create a webhook endpoint at `https://www.torchandtrowel.com/api/stripe-webhook`.
2. Subscribe it only to `checkout.session.completed`.
3. Copy the endpoint signing secret into Cloudflare Pages as `STRIPE_WEBHOOK_SECRET`.
4. Complete one test checkout and confirm `purchase_completed` appears in the funnel dashboard.
