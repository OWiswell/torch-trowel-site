import { getEmailForStep } from "../lib/email-sequence.js";
import { cleanEmail, isSameOriginRequest, isValidEmail, json, makeId, makeToken, nowIso, recordAnalyticsEvent, recordEmailEvent, verifyTurnstile } from "../lib/db.js";
import { sendSequenceEmail } from "../lib/resend.js";

const subscriberFromRow = (row) => ({
  ...row,
  sequence_step: Number(row.sequence_step || 0)
});

export const onRequestPost = async ({ request, env }) => {
  if (!isSameOriginRequest(request)) {
    return json({ ok: false, error: "Invalid request origin" }, { status: 403 });
  }

  if (!env.DB) {
    return json({ ok: false, error: "Cloudflare D1 binding DB is not configured" }, { status: 500 });
  }

  const formData = await request.formData();
  if (String(formData.get("website") || "").trim()) return json({ ok: true });

  const turnstile = await verifyTurnstile(request, env, formData.get("cf-turnstile-response"));
  if (!turnstile.ok) {
    await recordAnalyticsEvent(env, "blocked_lead_form_bot_check", { path: "/api/subscribe" });
    return json({ ok: false, error: "Please refresh and try again." }, { status: 403 });
  }

  const email = cleanEmail(formData.get("email"));
  const name = String(formData.get("name") || "").trim().slice(0, 120);
  const source = String(formData.get("source") || "Website signup").trim().slice(0, 300);

  if (!isValidEmail(email)) {
    return json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  }

  const existing = await env.DB.prepare("SELECT * FROM subscribers WHERE email = ?").bind(email).first();
  const now = nowIso();
  let subscriber;
  let shouldSendWelcome = false;

  if (existing) {
    if (existing.status === "unsubscribed") {
      await recordEmailEvent(env, "resubscribe_blocked", subscriberFromRow(existing), { source });
      return json({ ok: true });
    }

    await env.DB.prepare(`
      UPDATE subscribers
      SET name = COALESCE(NULLIF(?, ''), name),
          source = ?,
          updated_at = ?
      WHERE email = ?
    `).bind(name, source, now, email).run();
    subscriber = subscriberFromRow(await env.DB.prepare("SELECT * FROM subscribers WHERE email = ?").bind(email).first());
    shouldSendWelcome = existing.status !== "active" || Number(existing.sequence_step || 0) === 0;
  } else {
    subscriber = {
      id: makeId(),
      email,
      name,
      source,
      status: "active",
      sequence_key: "free_lesson",
      sequence_step: 0,
      subscribed_at: now,
      updated_at: now,
      unsubscribed_at: null,
      last_sent_at: null,
      unsubscribe_token: makeToken()
    };

    await env.DB.prepare(`
      INSERT INTO subscribers (id, email, name, source, status, sequence_key, sequence_step, subscribed_at, updated_at, unsubscribe_token)
      VALUES (?, ?, ?, ?, 'active', 'free_lesson', 0, ?, ?, ?)
    `).bind(subscriber.id, subscriber.email, subscriber.name, subscriber.source, now, now, subscriber.unsubscribe_token).run();
    shouldSendWelcome = true;
  }

  await recordAnalyticsEvent(env, "server_submit_lead_form", { source, path: "/api/subscribe" });
  await recordEmailEvent(env, existing ? "subscriber_updated" : "subscriber_created", subscriber, { source });

  if (shouldSendWelcome) {
    const result = await sendSequenceEmail(env, subscriber, getEmailForStep(0));
    if (result.ok && !result.skipped) {
      await env.DB.prepare(`
        UPDATE subscribers
        SET sequence_step = 1, last_sent_at = ?, updated_at = ?
        WHERE id = ?
      `).bind(nowIso(), nowIso(), subscriber.id).run();
    }
  }

  return json({ ok: true });
};
