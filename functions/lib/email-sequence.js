export const EMAIL_SEQUENCE = [
  {
    key: "deliver-free-lesson",
    delayDays: 0,
    subject: "Your free Torch & Trowel drawing lesson",
    preview: "Here is the free lesson page plus a simple way to use it today.",
    body: ({ name, siteUrl, unsubscribeUrl }) => `
      <p>Hi${name ? ` ${name}` : ""},</p>
      <p>Your free drawing lesson is ready here:</p>
      <p><a href="${siteUrl}/free-sample-v1.html">Open the free lesson</a></p>
      <p>Print the student worksheet, keep the guide nearby, and let the student work with a pencil before adding any extra instruction.</p>
      <p>If the lesson helps your table, the full Drawing Field Kit is here:</p>
      <p><a href="${siteUrl}/drawing-field-kit.html">See the Drawing Field Kit</a></p>
      <p style="font-size: 12px; color: #666;">You can <a href="${unsubscribeUrl}">unsubscribe here</a>.</p>
    `
  },
  {
    key: "day-1-first-win",
    delayDays: 1,
    subject: "The first drawing win to look for",
    preview: "A tiny observation that makes the lesson feel calmer.",
    body: ({ siteUrl, unsubscribeUrl }) => `
      <p>The first win is not a perfect drawing. It is a student noticing a line, copying it with care, and trying again without panic.</p>
      <p>That is the core habit Torch & Trowel is built to practice: observation before performance.</p>
      <p>If you want the full screen-free sequence, start here:</p>
      <p><a href="${siteUrl}/drawing-field-kit.html">View the Drawing Field Kit</a></p>
      <p style="font-size: 12px; color: #666;">You can <a href="${unsubscribeUrl}">unsubscribe here</a>.</p>
    `
  },
  {
    key: "day-3-why-works",
    delayDays: 3,
    subject: "Why the lesson is intentionally simple",
    preview: "The simplicity is doing more work than it first appears.",
    body: ({ siteUrl, unsubscribeUrl }) => `
      <p>Simple drawing prompts reduce the noise. Students can focus on one visible problem at a time: line, angle, proportion, spacing, and revision.</p>
      <p>The full kit keeps that same rhythm across a larger sequence so families can build skill without building a new planning burden.</p>
      <p><a href="${siteUrl}/curriculum.html">See what is inside the curriculum</a></p>
      <p style="font-size: 12px; color: #666;">You can <a href="${unsubscribeUrl}">unsubscribe here</a>.</p>
    `
  },
  {
    key: "day-5-objections",
    delayDays: 5,
    subject: "If you do not feel like an art teacher",
    preview: "You do not need to become one before your student can begin.",
    body: ({ siteUrl, unsubscribeUrl }) => `
      <p>You do not need to perform as an art teacher to help a student practice drawing. You need a clear exercise, a page to print, and a way to notice what changed.</p>
      <p>That is why the kit is structured around practical table-ready lessons instead of long lectures.</p>
      <p><a href="${siteUrl}/start-here.html">Start with the simplest path</a></p>
      <p style="font-size: 12px; color: #666;">You can <a href="${unsubscribeUrl}">unsubscribe here</a>.</p>
    `
  },
  {
    key: "day-7-product-bridge",
    delayDays: 7,
    subject: "Ready for the full Drawing Field Kit?",
    preview: "Here is the bridge from the free lesson to the full kit.",
    body: ({ siteUrl, unsubscribeUrl }) => `
      <p>If the free lesson gave your student a useful start, the full Drawing Field Kit gives you the next steps without needing a screen, subscription, or complicated setup.</p>
      <p><a href="${siteUrl}/drawing-field-kit.html">Get the Drawing Field Kit</a></p>
      <p style="font-size: 12px; color: #666;">You can <a href="${unsubscribeUrl}">unsubscribe here</a>.</p>
    `
  },
  {
    key: "day-10-final-nudge",
    delayDays: 10,
    subject: "A final nudge before this sequence ends",
    preview: "A simple way to keep drawing practice moving.",
    body: ({ siteUrl, unsubscribeUrl }) => `
      <p>Last note from this free lesson sequence: momentum usually comes from having the next printable page ready before enthusiasm fades.</p>
      <p>The Drawing Field Kit is built for that exact moment.</p>
      <p><a href="${siteUrl}/drawing-field-kit.html">Continue with the full kit</a></p>
      <p style="font-size: 12px; color: #666;">You can <a href="${unsubscribeUrl}">unsubscribe here</a>.</p>
    `
  }
];

export const getEmailForStep = (step) => EMAIL_SEQUENCE[step] || null;

export const textFromHtml = (html) => html
  .replace(/<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "$2: $1")
  .replace(/<[^>]+>/g, "")
  .replace(/\n\s+/g, "\n")
  .trim();
