const NOTION_VERSION = "2022-06-28";

const plainText = (property) => {
  if (!property) return "";
  if (property.type === "title") return (property.title || []).map((part) => part.plain_text || "").join("");
  if (property.type === "rich_text") return (property.rich_text || []).map((part) => part.plain_text || "").join("");
  return "";
};

const selectName = (property) => property?.select?.name || "";
const urlValue = (property) => property?.url || "";
const numberValue = (property) => property?.number;

const getProperty = (page, name) => page?.properties?.[name] || null;

const isStrictApprovalEnabled = (env) => String(env.NURTURE_REQUIRE_NOTION_APPROVAL || "").toLowerCase() === "true";

export const hasNotionApprovalConfig = (env) => Boolean(env.NOTION_API_TOKEN && env.NOTION_EMAIL_APPROVALS_DATABASE_ID);

export const getNotionEmailApproval = async (env, email) => {
  if (!email?.key) return { ok: false, approved: false, reason: "missing_email_key" };

  if (!hasNotionApprovalConfig(env)) {
    return {
      ok: true,
      approved: !isStrictApprovalEnabled(env),
      skipped: true,
      reason: isStrictApprovalEnabled(env) ? "missing_notion_config" : "notion_approval_not_configured"
    };
  }

  const response = await fetch(`https://api.notion.com/v1/databases/${env.NOTION_EMAIL_APPROVALS_DATABASE_ID}/query`, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${env.NOTION_API_TOKEN}`,
      "content-type": "application/json",
      "notion-version": env.NOTION_VERSION || NOTION_VERSION
    },
    body: JSON.stringify({
      page_size: 1,
      filter: {
        property: "Email Key",
        rich_text: {
          equals: email.key
        }
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return {
      ok: false,
      approved: false,
      reason: "notion_query_failed",
      status: response.status,
      detail: detail.slice(0, 500)
    };
  }

  const payload = await response.json().catch(() => ({}));
  const page = payload.results?.[0];
  if (!page) return { ok: true, approved: false, reason: "approval_card_missing" };

  const status = selectName(getProperty(page, "Approval Status"));
  const approved = status === "Approved";

  return {
    ok: true,
    approved,
    reason: approved ? "approved" : "not_approved",
    pageId: page.id,
    pageUrl: page.url,
    status,
    overrides: {
      subject: plainText(getProperty(page, "Subject")),
      headline: plainText(getProperty(page, "Headline")),
      preview: plainText(getProperty(page, "Preview Text")),
      heroImage: urlValue(getProperty(page, "Hero Image URL")),
      heroAlt: plainText(getProperty(page, "Hero Alt")),
      primaryCta: plainText(getProperty(page, "Primary CTA")),
      primaryCtaUrl: urlValue(getProperty(page, "Primary CTA URL")),
      step: numberValue(getProperty(page, "Step"))
    }
  };
};

export const applyEmailApprovalOverrides = (email, approval) => {
  const overrides = approval?.overrides || {};
  const metadata = {
    approvalPageId: approval?.pageId,
    approvalPageUrl: approval?.pageUrl,
    approvalStatus: approval?.status
  };

  return {
    ...email,
    subject: overrides.subject || email.subject,
    preview: overrides.preview || email.preview,
    approval: metadata,
    body: (context) => email.body({
      ...context,
      headline: overrides.headline || context.headline,
      preview: overrides.preview || email.preview,
      heroImage: overrides.heroImage || context.heroImage,
      heroAlt: overrides.heroAlt || context.heroAlt,
      primaryCta: overrides.primaryCta || context.primaryCta,
      primaryCtaUrl: overrides.primaryCtaUrl || context.primaryCtaUrl
    })
  };
};
