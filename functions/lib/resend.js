import { recordEmailEvent, siteUrl } from "./db.js";
import { textFromHtml } from "./email-sequence.js";

export const unsubscribeUrlFor = (env, subscriber) => {
  const params = new URLSearchParams({ token: subscriber.unsubscribe_token });
  return `${siteUrl(env)}/api/unsubscribe?${params.toString()}`;
};

export const sendSequenceEmail = async (env, subscriber, email) => {
  if (!email) return { ok: false, skipped: true, reason: "missing_email_template" };

  if (!env.RESEND_API_KEY) {
    await recordEmailEvent(env, "email_skipped_missing_resend_key", subscriber, { sequenceEmail: email.key, approval: email.approval });
    return { ok: true, skipped: true, reason: "missing_resend_key" };
  }

  const from = env.RESEND_FROM || "Torch & Trowel <hello@torchandtrowel.com>";
  const unsubscribeUrl = unsubscribeUrlFor(env, subscriber);
  const html = email.body({
    name: subscriber.name,
    siteUrl: siteUrl(env),
    unsubscribeUrl
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [subscriber.email],
      subject: email.subject,
      html,
      text: `${email.preview}\n\n${textFromHtml(html)}`,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`
      }
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    await recordEmailEvent(env, "email_failed", subscriber, {
      sequenceEmail: email.key,
      approval: email.approval,
      status: response.status,
      payload
    });
    return { ok: false, status: response.status, payload };
  }

  await recordEmailEvent(env, "email_sent", subscriber, {
    sequenceEmail: email.key,
    approval: email.approval,
    providerId: payload.id
  });
  return { ok: true, providerId: payload.id };
};
