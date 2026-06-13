export const json = (body, init = {}) => new Response(JSON.stringify(body), {
  ...init,
  headers: {
    "content-type": "application/json; charset=utf-8",
    ...(init.headers || {})
  }
});

export const html = (body, init = {}) => new Response(body, {
  ...init,
  headers: {
    "content-type": "text/html; charset=utf-8",
    ...(init.headers || {})
  }
});

export const cleanEmail = (value) => String(value || "").trim().toLowerCase();

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const nowIso = () => new Date().toISOString();

export const makeId = () => crypto.randomUUID();

export const makeToken = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const siteUrl = (env) => String(env.SITE_URL || "https://www.torchandtrowel.com").replace(/\/$/, "");

export const isSameOriginRequest = (request) => {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
};

export const verifyTurnstile = async (request, env, token) => {
  if (!env.TURNSTILE_SECRET_KEY) return { ok: true, skipped: true };
  if (!token) return { ok: false, error: "Missing bot check token" };

  const formData = new FormData();
  formData.append("secret", env.TURNSTILE_SECRET_KEY);
  formData.append("response", token);
  formData.append("remoteip", request.headers.get("CF-Connecting-IP") || "");

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData
  });
  const result = await response.json().catch(() => ({}));
  return { ok: Boolean(result.success), result };
};

export const recordAnalyticsEvent = async (env, eventName, detail = {}) => {
  if (!env.DB || !eventName) return;
  await env.DB.prepare(`
    INSERT INTO analytics_events (id, event_name, path, source, label, detail, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    makeId(),
    String(eventName).slice(0, 120),
    String(detail.path || "").slice(0, 300),
    String(detail.source || "").slice(0, 300),
    String(detail.label || "").slice(0, 300),
    JSON.stringify(detail).slice(0, 3000),
    nowIso()
  ).run();
};

export const recordEmailEvent = async (env, eventType, subscriber, detail = {}) => {
  if (!env.DB) return;
  await env.DB.prepare(`
    INSERT INTO email_events (id, subscriber_id, email, event_type, sequence_key, sequence_step, provider_id, detail, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    makeId(),
    subscriber?.id || null,
    subscriber?.email || null,
    eventType,
    subscriber?.sequence_key || "free_lesson",
    Number.isFinite(subscriber?.sequence_step) ? subscriber.sequence_step : null,
    detail.providerId || null,
    JSON.stringify(detail).slice(0, 3000),
    nowIso()
  ).run();
};
