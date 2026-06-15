import { json } from "../lib/db.js";

const isAuthorized = (request, env) => {
  if (!env.TRACKER_API_TOKEN) return true;
  return request.headers.get("authorization") === `Bearer ${env.TRACKER_API_TOKEN}`;
};

const appsScriptUrl = (env, action) => {
  const base = String(env.APPS_SCRIPT_WEB_APP_URL || "").trim();
  if (!base) return null;
  const url = new URL(base);
  if (action) url.searchParams.set("action", action);
  return url.toString();
};

const forwardToAppsScript = async (request, env) => {
  if (!isAuthorized(request, env)) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const incomingUrl = new URL(request.url);
  const action = incomingUrl.searchParams.get("action") || "dashboard";
  const target = appsScriptUrl(env, action);

  if (!target) {
    return json({
      ok: false,
      error: "APPS_SCRIPT_WEB_APP_URL is not configured"
    }, { status: 500 });
  }

  const init = request.method === "GET"
    ? { method: "GET" }
    : {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: env.TRACKER_API_TOKEN || "",
          payload: await request.json().catch(() => ({}))
        })
      };

  const response = await fetch(target, init);
  const text = await response.text();

  return new Response(text, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
};

export const onRequestGet = forwardToAppsScript;
export const onRequestPost = forwardToAppsScript;
