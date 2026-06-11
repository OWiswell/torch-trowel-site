# Analytics Setup

This site is ready for two Cloudflare-native measurement layers:

1. Cloudflare Web Analytics for pageviews, traffic sources, and performance.
2. Cloudflare Zaraz for custom funnel events such as CTA clicks, form starts, downloads, and buy-button clicks.

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
