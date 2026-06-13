# Torch & Trowel Site Rebuild

Static first-pass recreation of `www.torchandtrowel.com`.

## Pages

- `index.html` - homepage and product offer
- `curriculum.html` - curriculum overview
- `policies.html` - terms, privacy, and refund policy
- `free-sample-v1.html` - hidden free sample download page
- `curriculum-sample.html` - hidden sample lesson / curriculum preview page
- `product-drfk01.html` - hidden product delivery page
- `robots.txt` and `sitemap.xml` - match the published Framer route set
- `framer-page-audit.md` - route inventory including hidden `noindex` Framer pages
- `docs/conversion-map.md` - canonical funnel, tracking events, and weekly optimization checklist
- `docs/analytics-setup.md` - Cloudflare Web Analytics and Zaraz setup notes
- `docs/email-nurture-cloudflare-resend.md` - Cloudflare D1, Pages Functions, Resend, and analytics setup
- `database/schema.sql` - D1 tables for subscribers, email events, and analytics events
- `_headers` - Cloudflare Pages security headers

## Notes

- Framer-hosted image assets have been localized into this repo under `assets/`.
- The signup forms post to `/api/subscribe`, which is implemented as a Cloudflare Pages Function.
- Successful signups redirect to `free-sample-v1.html`.
- The Stripe checkout link matches the live site button.
- The live Framer sitemap currently publishes only `/`, `/curriculum`, and `/policies`, but direct-access `noindex` routes also exist in Framer.
- Hidden direct-access pages include `noindex` meta tags, matching Framer's SEO behavior.

## Signup Form

The forms are wired to the Cloudflare + Resend funnel:

```html
<form class="lead-form" action="/api/subscribe" data-lead-form data-success-url="./free-sample-v1.html">
```

Current submitted fields are `name`, `email`, `subject`, and `source`. The hidden `website` field is a basic honeypot for spam bots.

For production, configure the Cloudflare Pages `DB` binding, Resend secret, sender address, Turnstile widget, and scheduled nurture Worker described in `docs/email-nurture-cloudflare-resend.md`.

## Local Preview

Open `index.html` directly in a browser, or run a simple local server from this folder:

```sh
python3 -m http.server 4173
```

The simple local Python server uses direct file URLs like `/curriculum.html`.
Cloudflare Pages serves the extensionless production URLs through the static route fallback behavior already verified on the Pages deployment.
