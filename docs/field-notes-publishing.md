# Field Notes publishing flow

Use the website as the source of truth, then adapt each post outward.

## Recommended system

1. Write the full article or short Field Note for the website first.
2. Add the post to the Field Notes page, `feed.xml`, and `feed.json`.
3. Create 2-4 social adaptations from the same idea:
   - Instagram carousel or image post
   - Pinterest pin
   - Short email/nurture excerpt
   - Optional Threads/Facebook text post
4. Link each social post back to the article, free lesson, or Field Kit.

## Why this path

This follows the POSSE idea: publish on your own site first, then syndicate elsewhere. Torch & Trowel keeps the original post, search value, RSS feed, and LLM-readable source. Social platforms get adapted versions instead of becoming the only place the idea lives.

## Automation options

- Manual: write article, then make platform-specific posts yourself.
- Lightweight: use RSS or JSON Feed with Buffer, Zapier, Make, or IFTTT to create social drafts.
- Later: add a Cloudflare Worker that reads `feed.json`, creates platform-specific drafts, and sends them to a scheduler or Notion approval queue.

## Suggested content unit

For each article, prepare:

- Article title
- Short excerpt
- One square image
- One vertical image or carousel outline
- 3 social captions
- CTA target: free lesson, Field Kit, or related article

Do not auto-post everything without review. The website version can be final, but social copy usually needs cropping, shorter hooks, and platform-specific language.
