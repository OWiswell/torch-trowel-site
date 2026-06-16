import { EMAIL_SEQUENCE } from "../lib/email-sequence.js";
import { html, json } from "../lib/db.js";
import { applyEmailApprovalOverrides, getNotionEmailApproval } from "../lib/notion-approvals.js";
import { unsubscribeUrlFor } from "../lib/resend.js";

const isAuthorized = (request, env) => {
  if (!env.EMAIL_PREVIEW_TOKEN) return false;
  const url = new URL(request.url);
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return bearer === env.EMAIL_PREVIEW_TOKEN || url.searchParams.get("token") === env.EMAIL_PREVIEW_TOKEN;
};

export const onRequestGet = async ({ request, env }) => {
  if (!isAuthorized(request, env)) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const key = url.searchParams.get("key") || EMAIL_SEQUENCE[0]?.key;
  const template = EMAIL_SEQUENCE.find((email) => email.key === key);
  if (!template) return json({ ok: false, error: "Email template not found" }, { status: 404 });

  const approval = await getNotionEmailApproval(env, template);
  const email = applyEmailApprovalOverrides(template, approval);
  const subscriber = {
    name: "Matt",
    unsubscribe_token: "preview"
  };

  return html(email.body({
    name: subscriber.name,
    siteUrl: String(env.SITE_URL || "https://www.torchandtrowel.com").replace(/\/$/, ""),
    unsubscribeUrl: unsubscribeUrlFor(env, subscriber)
  }), {
    headers: {
      "x-robots-tag": "noindex",
      "cache-control": "no-store"
    }
  });
};
