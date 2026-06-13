import { json } from "../lib/db.js";

export const onRequestGet = async ({ env }) => json({
  turnstileSiteKey: env.TURNSTILE_SITE_KEY || null
});
