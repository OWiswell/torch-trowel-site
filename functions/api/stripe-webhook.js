import { json, recordAnalyticsEvent } from "../lib/db.js";

const toHex = (buffer) => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");

const secureEqual = (left, right) => {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
};

const verifyStripeSignature = async (payload, signatureHeader, secret) => {
  const parts = String(signatureHeader || "").split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || !signatures.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = toHex(digest);
  return signatures.some((signature) => secureEqual(signature, expected));
};

export const onRequestPost = async ({ request, env }) => {
  if (!env.STRIPE_WEBHOOK_SECRET) return json({ ok: false, error: "Stripe webhook is not configured" }, { status: 503 });
  const payload = await request.text();
  const verified = await verifyStripeSignature(payload, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET);
  if (!verified) return json({ ok: false, error: "Invalid signature" }, { status: 400 });

  const event = JSON.parse(payload);
  if (event.type === "checkout.session.completed") {
    const session = event.data?.object || {};
    await recordAnalyticsEvent(env, "purchase_completed", {
      path: "/api/stripe-webhook",
      source: "stripe",
      label: session.payment_status || "completed",
      amountTotal: session.amount_total || 0,
      currency: session.currency || "usd",
      checkoutSessionId: session.id || ""
    });
  }

  return json({ received: true });
};
