# Field Notes Content Feed

Field Notes have two layers:

- Short practical notes are rendered from `data/field-notes.json`.
- Long-form articles are regular HTML pages linked from `field-notes.html`, `feed.xml`, and `feed.json`.

## Current publishing flow

1. Add an image to `assets/field-notes/`.
2. Add a post object to `data/field-notes.json`.
3. Set `"featured"` to the post `id` that should appear at the top.
4. Deploy the site.

## Post schema

```json
{
  "id": "short-url-safe-id",
  "title": "Article title",
  "category": "Parent tip",
  "date": "2026-05-24",
  "readTime": "4 min read",
  "image": "./assets/field-notes/example.png",
  "imageAlt": "Useful alt text",
  "excerpt": "Short article preview.",
  "takeaways": ["Optional featured-post bullet"],
  "url": "#short-url-safe-id",
  "social": {
    "instagram": "https://www.instagram.com/torchandtrowel",
    "pinterest": "https://www.pinterest.com/torchandtrowel"
  }
}
```

## Future control room flow

A small admin tool can generate this file from a form, Google Sheet, Airtable, Notion, or a custom database. The public website does not need to change as long as the generated output keeps this JSON shape.

For social publishing, keep the website as the source of truth:

1. Create or approve a Field Note.
2. Generate the web post metadata and image crop.
3. Push the post to the website feed (`feed.xml` and `feed.json` for articles, `data/field-notes.json` for short notes).
4. Send adapted versions to Instagram and Pinterest.

Instagram and Pinterest publishing should stay external to the static website. The site should display and archive the content; an automation or backend service should handle posting to those platforms.
