/* Utility Costs loader: Home Assistant keeps the module URL it registered at start-up,
 * so after an update without a restart the browser would keep the old files.
 * This tiny module asks for the installed version on every load (never cached)
 * and imports the real module with that version as the cache key.
 *   uc-load.js?m=utility-costs-panel.js&v=<version at start-up>
 */
const self = new URL(import.meta.url);
const name = (self.searchParams.get("m") || "utility-costs-panel.js").replace(/[^\w.-]/g, "");
let v = self.searchParams.get("v") || "0";
try {
  const r = await fetch(new URL("version.json", self), { cache: "no-store" });
  if (r.ok) v = (await r.json()).version || v;
} catch (e) { /* offline or blocked: use the start-up version */ }
await import(new URL(`${name}?v=${encodeURIComponent(v)}`, self).href);
