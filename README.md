# Torch & Trowel Site Rebuild

Static first-pass recreation of `www.torchandtrowel.com`.

## Pages

- `index.html` - homepage and product offer
- `curriculum.html` - curriculum overview
- `policies.html` - terms, privacy, and refund policy
- `free-sample-v1.html` - hidden free sample download page
- `curriculum-sample.html` - hidden sample lesson / curriculum preview page
- `product-drfk01.html` - hidden product delivery page
- `_redirects` - deploy-time clean URL support for `/curriculum` and `/policies`
- `robots.txt` and `sitemap.xml` - match the published Framer route set
- `framer-page-audit.md` - route inventory including hidden `noindex` Framer pages
- `docs/conversion-map.md` - canonical funnel, tracking events, and weekly optimization checklist
- `docs/analytics-setup.md` - Cloudflare Web Analytics and Zaraz setup notes

## Notes

- The first pass references the live Framer-hosted image assets so visual matching can begin immediately.
- The signup form is endpoint-ready. Add a provider URL to the `action` attribute on each `[data-lead-form]` form to start sending submissions, then successful signups will redirect to `free-sample-v1.html`.
- The Stripe checkout link matches the live site button.
- The live Framer sitemap currently publishes only `/`, `/curriculum`, and `/policies`, but direct-access `noindex` routes also exist in Framer.
- Hidden direct-access pages include `noindex` meta tags, matching Framer's SEO behavior.

## Signup Form

Recommended quick launch: create a form endpoint with Basin or Formspree, set notifications to `matt@torchandtrowel.com`, then paste the endpoint into both signup forms:

```html
<form class="lead-form" action="https://your-provider-endpoint" data-lead-form data-success-url="./free-sample-v1.html">
```

Current submitted fields are `name`, `email`, `role`, `subject`, and `source`. The hidden `website` field is a basic honeypot for spam bots.

For scale, use an email marketing tool such as ConvertKit, MailerLite, or Beehiiv instead of only inbox notifications. That gives Torch & Trowel a subscriber list, automated free lesson delivery, unsubscribe compliance, and product launch sequences.

## Local Preview

Open `index.html` directly in a browser, or run a simple local server from this folder:

```sh
python3 -m http.server 4173
```

The simple local Python server uses direct file URLs like `/curriculum.html`.
Cloudflare Pages will use `_redirects` so the production URLs match Framer.
