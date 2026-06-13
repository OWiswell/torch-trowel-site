# Cloudflare + Resend Funnel

This setup replaces a paid ConvertKit/MailerLite-style nurture with code that runs on Cloudflare.

## What Is Included

- `/api/subscribe` receives free-lesson signups from the website forms.
- Cloudflare D1 stores subscribers, unsubscribe tokens, email send events, and lightweight funnel events.
- Resend sends the free lesson delivery email and the nurture sequence.
- `/api/unsubscribe` handles unsubscribe links.
- `/api/track` stores custom conversion events from `script.js`.
- `/api/nurture` sends due nurture emails when called by a protected cron worker.

## Cloudflare Setup

1. Create a D1 database named `torch_trowel_funnel`.
2. Run `database/schema.sql` against that D1 database.
3. Add a D1 binding to the Pages project:
   - Binding name: `DB`
   - Database: `torch_trowel_funnel`
4. Add these environment variables to the Pages project:
   - `SITE_URL`: `https://www.torchandtrowel.com`
   - `RESEND_FROM`: `Torch & Trowel <hello@torchandtrowel.com>`
   - `NURTURE_DAILY_LIMIT`: `50`
5. Add these secrets to the Pages project:
   - `RESEND_API_KEY`
   - `NURTURE_SHARED_SECRET`
   - `TURNSTILE_SECRET_KEY` after the Turnstile widget is added to the forms

Do not commit Resend keys or Cloudflare tokens to GitHub.

## Anti-Spam Setup

The public signup endpoint is same-origin checked and Turnstile-ready. To enable Turnstile:

1. Create a Cloudflare Turnstile widget for `torchandtrowel.com`.
2. Add the public site key to Cloudflare Pages as `TURNSTILE_SITE_KEY`.
3. Add the private secret to Cloudflare Pages as `TURNSTILE_SECRET_KEY`.

Do not add `TURNSTILE_SECRET_KEY` before `TURNSTILE_SITE_KEY`, or legitimate form submissions will not have a Turnstile token.

## Resend Setup

1. Verify the sending domain in Resend.
2. Use an address on the domain, such as `hello@torchandtrowel.com`.
3. Paste the API key into Cloudflare as `RESEND_API_KEY`.
4. Keep the physical mailing address and sender identity truthful in the final email copy before scaling traffic.

## Nurture Sending

Cloudflare Pages Functions do not run scheduled jobs by themselves. Use `workers/nurture-cron.js` as a tiny scheduled Worker that calls:

```txt
POST https://www.torchandtrowel.com/api/nurture
Authorization: Bearer <NURTURE_SHARED_SECRET>
```

Recommended schedule: once per day. The endpoint caps sends through `NURTURE_DAILY_LIMIT`.

The nurture endpoint only accepts the secret in the `Authorization` header. Do not pass the secret in a URL query string.

## Analytics

The site now records core events in two ways:

- Browser-side tools: Zaraz, Google Tag Manager `dataLayer`, or Plausible if present.
- Cloudflare D1 fallback: `/api/track` stores custom events in `analytics_events`.

This gives a no-subscription starting point for weekly funnel review:

- CTA clicks
- Form starts
- Form submissions
- Free sample downloads
- Product page clicks
- Buy button clicks

## First Production Test

1. Deploy to Cloudflare Pages.
2. Submit the free lesson form with a test email.
3. Confirm a `subscribers` row exists in D1.
4. Confirm the delivery email arrives from Resend.
5. Click the unsubscribe link and confirm the subscriber status changes to `unsubscribed`.
6. Click a few tracked CTAs and confirm rows appear in `analytics_events`.
