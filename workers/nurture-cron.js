export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(runNurture(env));
  }
};

async function runNurture(env) {
  const siteUrl = String(env.SITE_URL || "https://www.torchandtrowel.com").replace(/\/$/, "");
  const response = await fetch(`${siteUrl}/api/nurture`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.NURTURE_SHARED_SECRET}`
    }
  });

  if (!response.ok) {
    throw new Error(`Nurture endpoint failed with ${response.status}`);
  }
}
