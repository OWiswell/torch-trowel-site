# Framer Fidelity Audit

Audited May 23, 2026 against the browser-based Framer editor at 25-100% zoom,
the Framer asset/component panel, saved Framer HTML exports in `/private/tmp`,
and the local rebuild.

## Framer Component Inventory

Project components visible in Framer Assets:

- Hover-feature
- Hover-Data
- Video-Play-Button
- Button
- Field Kit
- 00-Navigation
- Button 2
- TNT-Footer
- Menu
- NAVBAR-LINK
- Product-Listing
- 05-Philosophy
- tertiary-button
- Quote Ticker
- CTA
- Pain-Point-Quote
- Buy Now CTA
- 06-Email Sign UP
- Sign-Up Kit
- 02-Product Carousel
- Product-01-Carousel
- Carousel-Horizontal
- Carousel-Product-Tablet
- Feature-Slider
- Feature Switcher
- Tabs Layout
- Feature Tab Item
- Download-component
- Card-expand
- Title Reveal
- Curriculum Sheets
- Podcast-Only

Local rebuild status: the visible components now carry matching local
`component-*` classes for navigation, footer, buttons, product listing, audio,
sign-up, quote ticker, download/delivery pages, and curriculum sheets. The
remaining gap is that Framer components still have variants and internal
property controls that static HTML/CSS classes do not expose.

## Assets

Matched local assets:

- Logo: `Zo1LkQrlxiSEKujTSfp3CSWoc.png`
- Home hero video: `YjNq3wvUmMvicMY8Rz60QOmJVQ.mp4`
- Home hero poster: `AkGPApyptheLNUlSnVoWIkdzYI.png`
- Product kit image: `N1lMD65868zjUlD1sNQk2LdqBA.png`
- Product delivery image: `5Ge2dyBCi8lT4ttyQvBiIzIWqc.png`
- Curriculum hero image: `OyKTtcBqIqkHjG9qz87wiqDY.png`
- Philosophy image: `zUYqlU6QVyPJ1dy8mHH2mWdm4xc.png`
- Audio: `K334RxE36KkpstVDnTbkB2jYM.m4a`
- Free sample brand image: `cwiMT2BsusyExDACUsRzlbFI44.png`
- Curriculum sample pages: `Jzz5Kp...`, `bnnXl...`, `gSRD...`

Known asset gaps:

- Framer uses more curriculum sample sheet assets than the local sample page
  currently renders. Local uses the first three sheets only.
- Framer favicon/social images (`V0oSR...`, `qJPt...`, `8wv...`, `cwiMT...`)
  are now wired into every local HTML head.
- Framer has two arrow SVG assets (`11KSG...`, `6tT...`). Local uses the
  right-arrow asset on the quote carousel and inline SVG/path icons elsewhere.

## Fonts

Framer source uses:

- Bespoke Serif: headings, serif links, hero/product text.
- Inter / Inter Variable: many UI/component styles, footer links, policies,
  buttons in some components.
- Multiple weights: Light, Medium, SemiBold, Bold, ExtraBold, Variable.

Local rebuild uses:

- Bespoke Serif font-face for regular/italic/bold areas.
- Inter and Inter Variable from Framer asset URLs for sans text.

Font gap:

- The major sans-serif mismatch is fixed. A small residual gap remains because
  Framer loads many unicode-range slices and variant weights; local loads the
  Latin ranges and weights currently used by the visible pages.

## Icons

Matched or close:

- Speaker/audio icon uses the extracted Framer path.
- Stat icons use extracted Framer-like path data.
- Download icon uses extracted Framer path.
- Quote next button uses the Framer right-arrow SVG asset.

Remaining icon gaps:

- The product CTA external-arrow is now an SVG path rather than a text glyph.
- Curriculum sample eye icon is inline SVG, not confirmed as the exact Framer
  vector.
- Framer's button/icon component sizing is variant-driven. Local icons are
  hand-sized with CSS, so a few 1-3px differences are expected.

## Spacing And Layout

Strong matches:

- Desktop header max width and basic nav/logo placement.
- Home hero composition: centered headline, media, subhead, CTA row.
- Product block and audio callout structure.
- Policies page content cards.
- Hidden pages now follow the Framer editor layouts.

Known spacing gaps:

- Framer canvas uses exact absolute/component frame measurements per breakpoint.
  Local CSS uses semantic flow/layout. This is more maintainable, but not pixel
  identical in every viewport.
- Home hero media is larger locally at full browser width than the Framer editor
  1200 canvas preview suggests at 25% zoom. The proportion is close, but exact
  confirmation needs a 1200px viewport screenshot overlay.
- Curriculum page at tablet-ish widths differs in vertical rhythm around the
  hero quote, trust band, and tabs.
- Some cards use local border-radius values of 9-13px; Framer variants range
  from roughly 7px to 16px depending on component.

## Interactions

Matched:

- Mobile menu open/close.
- Quote carousel auto-advances and supports manual next click.
- Audio play/pause/progress works from the Framer audio file.
- Lead form has a local placeholder submission state.

Interaction gaps:

- Framer has carousel, feature switcher, tabs, card expand, title reveal, hover
  feature, and hover data components. Local only implements the interactions
  that are visible/necessary in the rebuilt pages so far.
- Lead form is not integrated with the eventual real provider.
- Product carousel and curriculum sheets are represented but not fully rebuilt
  as Framer-equivalent interactive components.

## Priority Fixes

1. Replace local sans font stack with Inter/Inter Variable where Framer uses it. Done.
2. Create named CSS/component blocks matching Framer components. Partially done:
   `Navigation`, `Button`, `ProductListing`, `AudioCallout`, `SignUpKit`,
   `Footer`, `QuoteTicker`, `CurriculumSheets`, `DownloadComponent`.
3. Wire favicon/social images into every HTML head. Done.
4. Replace remaining glyph/approximate icons with extracted Framer SVG paths. Product CTA done; eye icon still approximate.
5. Do breakpoint overlay passes at 1200, 1199-810, and 809px widths.
6. Decide whether to fully rebuild Framer-only interactions like Feature
   Switcher/Card Expand, or omit until those patterns are visible on live pages.
