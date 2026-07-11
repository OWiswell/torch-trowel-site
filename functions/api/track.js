import { isSameOriginRequest, json, recordAnalyticsEvent } from "../lib/db.js";

const normalizePath = (value = "") => {
  const path = String(value || "").trim();
  if (!path || path === "/index.html") return "/";
  return path.replace(/\.html$/, "");
};

export const onRequestPost = async ({ request, env }) => {
  if (!isSameOriginRequest(request)) {
    return json({ ok: false, error: "Invalid request origin" }, { status: 403 });
  }

  let payload = {};
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = String(payload.eventName || payload.event || "").slice(0, 120);
  if (!eventName) return json({ ok: false, error: "Missing eventName" }, { status: 400 });

  const detail = payload.detail && typeof payload.detail === "object" ? payload.detail : {};

  await recordAnalyticsEvent(env, eventName, {
    ...detail,
    path: normalizePath(payload.path || payload.detail?.path || ""),
    source: payload.source || payload.detail?.source || "",
    label: payload.label || payload.detail?.label || ""
  });

  return json({ ok: true });
};
