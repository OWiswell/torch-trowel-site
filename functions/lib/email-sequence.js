const escapeHtml = (value) => String(value || "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const button = (href, label) => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 26px 0;">
    <tr>
      <td style="border-radius: 6px; background: #2f3340;">
        <a href="${href}" style="display: inline-block; padding: 14px 20px; color: #ffffff; font-family: Arial, sans-serif; font-size: 15px; font-weight: 700; text-decoration: none;">${label}</a>
      </td>
    </tr>
  </table>
`;

const emailShell = ({ title, preview, siteUrl, unsubscribeUrl, heroImage, heroAlt, children }) => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin: 0; padding: 0; background: #f6f1e8;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f6f1e8;">
      <tr>
        <td align="center" style="padding: 28px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 620px; background: #fffdf8; border: 1px solid #e1d4b4; border-radius: 10px; overflow: hidden;">
            <tr>
              <td style="padding: 26px 30px 18px; background: #fffdf8;">
                <a href="${siteUrl}" style="text-decoration: none;">
                  <img src="${siteUrl}/assets/logo.png" width="210" alt="Torch & Trowel" style="display: block; max-width: 210px; height: auto; border: 0;">
                </a>
              </td>
            </tr>
            ${heroImage ? `
            <tr>
              <td style="padding: 0 30px 22px;">
                <img src="${heroImage}" width="560" alt="${escapeHtml(heroAlt)}" style="display: block; width: 100%; max-width: 560px; height: auto; border: 0; border-radius: 8px;">
              </td>
            </tr>` : ""}
            <tr>
              <td style="padding: 0 30px 34px; color: #2f3340; font-family: Georgia, 'Times New Roman', serif; font-size: 18px; line-height: 1.55;">
                ${children}
              </td>
            </tr>
            <tr>
              <td style="padding: 22px 30px; background: #2f3340; color: #f6f1e8; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6;">
                <strong style="color: #ffdc1d;">Torch &amp; Trowel</strong><br>
                Screen-free drawing curriculum for homeschool families.<br>
                <a href="${siteUrl}/drawing-field-kit.html" style="color: #ffdc1d;">Drawing Field Kit</a>
                <span style="color: #8f96a3;"> | </span>
                <a href="${unsubscribeUrl}" style="color: #f6f1e8;">Unsubscribe</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const lessonHero = (siteUrl) => `${siteUrl}/assets/free-lesson/dr101-overview-1.png`;
const fieldKitHero = (siteUrl) => `${siteUrl}/assets/field-kit.png`;

export const EMAIL_SEQUENCE = [
  {
    key: "deliver-free-lesson",
    delayDays: 0,
    subject: "Your free Torch & Trowel drawing lesson",
    preview: "Here is the free lesson page plus a simple way to use it today.",
    body: ({ name, siteUrl, unsubscribeUrl }) => emailShell({
      title: "Your free Torch & Trowel drawing lesson",
      preview: "Here is the free lesson page plus a simple way to use it today.",
      siteUrl,
      unsubscribeUrl,
      heroImage: lessonHero(siteUrl),
      heroAlt: "Preview page from the free Torch & Trowel drawing lesson",
      children: `
        <p style="margin: 0 0 18px;">Hi${name ? ` ${escapeHtml(name)}` : ""},</p>
        <h1 style="margin: 0 0 14px; color: #2f3340; font-family: Georgia, 'Times New Roman', serif; font-size: 30px; line-height: 1.12;">Your free drawing lesson is ready.</h1>
        <p style="margin: 0 0 18px;">Print the student worksheet, keep the guide nearby, and let the student work with a pencil before adding any extra instruction.</p>
        ${button(`${siteUrl}/free-sample-v1.html`, "Open the Free Lesson")}
        <p style="margin: 0;">If the lesson helps your table, the full Drawing Field Kit gives you the next screen-free steps.</p>
        <p style="margin: 14px 0 0;"><a href="${siteUrl}/drawing-field-kit.html" style="color: #9a7424; font-weight: 700;">See the Drawing Field Kit</a></p>
      `
    })
  },
  {
    key: "day-1-first-win",
    delayDays: 1,
    subject: "The first drawing win to look for",
    preview: "A tiny observation that makes the lesson feel calmer.",
    body: ({ siteUrl, unsubscribeUrl }) => emailShell({
      title: "The first drawing win to look for",
      preview: "A tiny observation that makes the lesson feel calmer.",
      siteUrl,
      unsubscribeUrl,
      heroImage: lessonHero(siteUrl),
      heroAlt: "Torch & Trowel printable drawing lesson page",
      children: `
        <h1 style="margin: 0 0 14px; color: #2f3340; font-family: Georgia, 'Times New Roman', serif; font-size: 30px; line-height: 1.12;">The first win is not a perfect drawing.</h1>
        <p style="margin: 0 0 18px;">It is a student noticing a line, copying it with care, and trying again without panic.</p>
        <p style="margin: 0 0 18px;">That is the core habit Torch & Trowel is built to practice: observation before performance.</p>
        ${button(`${siteUrl}/drawing-field-kit.html`, "View the Drawing Field Kit")}
      `
    })
  },
  {
    key: "day-3-why-works",
    delayDays: 3,
    subject: "Why the lesson is intentionally simple",
    preview: "The simplicity is doing more work than it first appears.",
    body: ({ siteUrl, unsubscribeUrl }) => emailShell({
      title: "Why the lesson is intentionally simple",
      preview: "The simplicity is doing more work than it first appears.",
      siteUrl,
      unsubscribeUrl,
      heroImage: `${siteUrl}/assets/curriculum-hero.png`,
      heroAlt: "Torch & Trowel curriculum materials",
      children: `
        <h1 style="margin: 0 0 14px; color: #2f3340; font-family: Georgia, 'Times New Roman', serif; font-size: 30px; line-height: 1.12;">The simplicity is doing real work.</h1>
        <p style="margin: 0 0 18px;">Simple drawing prompts reduce the noise. Students can focus on one visible problem at a time: line, angle, proportion, spacing, and revision.</p>
        <p style="margin: 0 0 18px;">The full kit keeps that same rhythm across a larger sequence so families can build skill without building a new planning burden.</p>
        ${button(`${siteUrl}/curriculum.html`, "See What Is Inside")}
      `
    })
  },
  {
    key: "day-5-objections",
    delayDays: 5,
    subject: "If you do not feel like an art teacher",
    preview: "You do not need to become one before your student can begin.",
    body: ({ siteUrl, unsubscribeUrl }) => emailShell({
      title: "If you do not feel like an art teacher",
      preview: "You do not need to become one before your student can begin.",
      siteUrl,
      unsubscribeUrl,
      heroImage: fieldKitHero(siteUrl),
      heroAlt: "Drawing Field Kit printable curriculum",
      children: `
        <h1 style="margin: 0 0 14px; color: #2f3340; font-family: Georgia, 'Times New Roman', serif; font-size: 30px; line-height: 1.12;">You do not need to perform as an art teacher.</h1>
        <p style="margin: 0 0 18px;">You need a clear exercise, a page to print, and a way to notice what changed.</p>
        <p style="margin: 0 0 18px;">That is why the kit is structured around practical table-ready lessons instead of long lectures.</p>
        ${button(`${siteUrl}/start-here.html`, "Start With the Simplest Path")}
      `
    })
  },
  {
    key: "day-7-product-bridge",
    delayDays: 7,
    subject: "Ready for the full Drawing Field Kit?",
    preview: "Here is the bridge from the free lesson to the full kit.",
    body: ({ siteUrl, unsubscribeUrl }) => emailShell({
      title: "Ready for the full Drawing Field Kit?",
      preview: "Here is the bridge from the free lesson to the full kit.",
      siteUrl,
      unsubscribeUrl,
      heroImage: fieldKitHero(siteUrl),
      heroAlt: "Torch & Trowel Drawing Field Kit",
      children: `
        <h1 style="margin: 0 0 14px; color: #2f3340; font-family: Georgia, 'Times New Roman', serif; font-size: 30px; line-height: 1.12;">Ready for the full Drawing Field Kit?</h1>
        <p style="margin: 0 0 18px;">If the free lesson gave your student a useful start, the full Drawing Field Kit gives you the next steps without needing a screen, subscription, or complicated setup.</p>
        ${button(`${siteUrl}/drawing-field-kit.html`, "Get the Drawing Field Kit")}
      `
    })
  },
  {
    key: "day-10-final-nudge",
    delayDays: 10,
    subject: "A final nudge before this sequence ends",
    preview: "A simple way to keep drawing practice moving.",
    body: ({ siteUrl, unsubscribeUrl }) => emailShell({
      title: "A final nudge before this sequence ends",
      preview: "A simple way to keep drawing practice moving.",
      siteUrl,
      unsubscribeUrl,
      heroImage: fieldKitHero(siteUrl),
      heroAlt: "Torch & Trowel Drawing Field Kit",
      children: `
        <h1 style="margin: 0 0 14px; color: #2f3340; font-family: Georgia, 'Times New Roman', serif; font-size: 30px; line-height: 1.12;">A final nudge before this sequence ends.</h1>
        <p style="margin: 0 0 18px;">Momentum usually comes from having the next printable page ready before enthusiasm fades.</p>
        <p style="margin: 0 0 18px;">The Drawing Field Kit is built for that exact moment.</p>
        ${button(`${siteUrl}/drawing-field-kit.html`, "Continue With the Full Kit")}
      `
    })
  }
];

export const getEmailForStep = (step) => EMAIL_SEQUENCE[step] || null;

export const textFromHtml = (html) => html
  .replace(/<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "$2: $1")
  .replace(/<[^>]+>/g, "")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, "\"")
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/\n\s+/g, "\n")
  .trim();
