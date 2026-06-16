import { EMAIL_SEQUENCE, getEmailForStep } from "../lib/email-sequence.js";
import { json, nowIso } from "../lib/db.js";
import { applyEmailApprovalOverrides, getNotionEmailApproval } from "../lib/notion-approvals.js";
import { sendSequenceEmail } from "../lib/resend.js";

const daysSince = (isoDate) => {
  const started = new Date(isoDate).getTime();
  if (!Number.isFinite(started)) return 0;
  return Math.floor((Date.now() - started) / 86400000);
};

const isAuthorized = (request, env) => {
  const expected = env.NURTURE_SHARED_SECRET;
  if (!expected) return false;
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return bearer === expected;
};

export const onRequestPost = async ({ request, env }) => {
  if (!isAuthorized(request, env)) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!env.DB) {
    return json({ ok: false, error: "Cloudflare D1 binding DB is not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || env.NURTURE_DAILY_LIMIT || 50), 100);
  const rows = await env.DB.prepare(`
    SELECT *
    FROM subscribers
    WHERE status = 'active'
      AND sequence_key = 'free_lesson'
      AND sequence_step < ?
    ORDER BY subscribed_at ASC
    LIMIT ?
  `).bind(EMAIL_SEQUENCE.length, limit).all();

  const results = [];
  for (const subscriber of rows.results || []) {
    const currentStep = Number(subscriber.sequence_step || 0);
    const email = getEmailForStep(currentStep);
    if (!email || daysSince(subscriber.subscribed_at) < email.delayDays) continue;

    const approval = await getNotionEmailApproval(env, email);
    if (!approval.approved) {
      results.push({
        subscriberId: subscriber.id,
        step: currentStep,
        sent: false,
        skipped: true,
        reason: approval.reason,
        approvalStatus: approval.status || null
      });
      await env.DB.prepare(`
        INSERT INTO email_events (id, subscriber_id, email, event_type, sequence_key, sequence_step, detail, created_at)
        VALUES (?, ?, ?, 'email_skipped_not_approved', ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        subscriber.id,
        subscriber.email,
        subscriber.sequence_key,
        currentStep,
        JSON.stringify({
          sequenceEmail: email.key,
          reason: approval.reason,
          status: approval.status,
          pageUrl: approval.pageUrl,
          detail: approval.detail
        }).slice(0, 3000),
        nowIso()
      ).run();
      continue;
    }

    const sent = await sendSequenceEmail(env, subscriber, applyEmailApprovalOverrides(email, approval));
    results.push({ subscriberId: subscriber.id, step: currentStep, sent: sent.ok, skipped: sent.skipped || false, approvalStatus: approval.status || null });

    if (sent.ok && !sent.skipped) {
      await env.DB.prepare(`
        UPDATE subscribers
        SET sequence_step = ?, last_sent_at = ?, updated_at = ?
        WHERE id = ?
      `).bind(currentStep + 1, nowIso(), nowIso(), subscriber.id).run();
    }
  }

  return json({ ok: true, processed: results.length, results });
};
