# Framer Page Audit

Audited against the live Framer sitemap, direct public URLs, and the Framer pages
sidebar screenshot from May 23, 2026.

## Route Inventory

| Framer page | Live status | SEO status | Rebuild status | Notes |
| --- | --- | --- | --- | --- |
| `/` | 200 | Indexed in sitemap | Built as `index.html` | Home/front page and main product offer. |
| `/curriculum` | 200 | Indexed in sitemap | Built as `curriculum.html` | Main curriculum sales/explanation page. |
| `/policies` | 200 | Indexed in sitemap | Built as `policies.html` | Terms, privacy, and refund policy. |
| `/product-drfk01` | 200 | `noindex` | Built as `product-drfk01.html` | Hidden/private product delivery or post-purchase page. Links to a Google Drive product folder. |
| `/design-system` | 200 | `noindex` | Not built yet | Internal design-system/reference page. Likely does not need to ship publicly unless used as a QA reference. |
| `/free-sample-v1` | 200 | `noindex` | Built as `free-sample-v1.html` | Free sample/download page. Links to a Google Drive file. |
| `/curriculum-sample` | 200 | `noindex` | Built as `curriculum-sample.html` | Free/sample curriculum page with audio, sample preview, and buy/free-lesson CTAs. Visible in the Framer screenshot. |

## Key Correction

The sitemap only exposes the three indexed routes: `/`, `/curriculum`, and `/policies`.
The Framer project contains four additional direct-access pages that are publicly reachable
but intentionally excluded from search with `noindex`.

## Rebuild Recommendation

- Build `/free-sample-v1` and `/curriculum-sample` before launch because visitors may land there from email, ads, forms, or shared links.
- Build or intentionally redirect `/product-drfk01` before launch because it appears to expose purchased product delivery.
- Do not include `/design-system` in the public sitemap. Either leave it unbuilt, protect it, or recreate it only as an internal QA reference.
- Keep `sitemap.xml` limited to indexed pages unless the Framer SEO settings change.
- Keep `robots.txt` permissive, matching Framer, and use page-level `noindex` meta tags for hidden routes that still need to be reachable.
