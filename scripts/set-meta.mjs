import Stripe from "stripe";
const key = process.argv[2];
if (!key) { console.log("Usage: node scripts/set-meta.mjs sk_test_..."); process.exit(1); }
const stripe = new Stripe(key);
const MAP = {
  "test_bJe9AS41yeKP7SkeIUdEs00": { plan: "pro_monthly" },
  "test_4gMbJ069G7in1tW8kwdEs01": { plan: "team_monthly" },
  "test_9B6eVc7dK9qv3C41W8dEs02": { plan: "pro_annual" },
  "test_7sY6oG9lS8mr6OggR2dEs03": { plan: "team_annual" },
  "test_8x2eVc69G9qv2y0eIUdEs07": { plan: "enterprise_monthly" },
  "test_14A00i2Xu9qv3C49oAdEs08": { plan: "enterprise_annual" },
  "test_bJebJ069G1Y31tWcAMdEs04": { pack: "starter" },
  "test_8x228q41yfOT0pS7gsdEs05": { pack: "growth" },
  "test_00wbJ0bu0auza0sgR2dEs06": { pack: "pro" },
};
const list = await stripe.paymentLinks.list({ limit: 100 });
for (const pl of list.data) {
  for (const [frag, meta] of Object.entries(MAP)) {
    if (pl.url.includes(frag)) {
      await stripe.paymentLinks.update(pl.id, { metadata: meta });
      console.log("STAMPED", pl.url, JSON.stringify(meta));
    }
  }
}
console.log("DONE");