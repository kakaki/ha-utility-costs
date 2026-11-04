/* Utility Costs dashboard card: cost of the current month and a forecast
 * for the year.   type: custom:utility-costs-card
 * Options: title (text), show_media (true), show_year (true)
 */
const L = {
  en: { title: "Utility costs", month: "This month", forecast: "forecast", ytd: "Year to date", year_fc: "Year forecast", prev: "last year", open: "Open", none: "No data yet" },
  pl: { title: "Koszty mediów", month: "Ten miesiąc", forecast: "prognoza", ytd: "Od początku roku", year_fc: "Prognoza roczna", prev: "rok temu", open: "Otwórz", none: "Brak danych" },
  de: { title: "Nebenkosten", month: "Dieser Monat", forecast: "Prognose", ytd: "Seit Jahresbeginn", year_fc: "Jahresprognose", prev: "Vorjahr", open: "Öffnen", none: "Noch keine Daten" },
};
const MEDIA = {
  en: { electricity: "Electricity", gas: "Gas", water: "Water", fuel: "Fuel" },
  pl: { electricity: "Prąd", gas: "Gaz", water: "Woda", fuel: "Paliwo" },
  de: { electricity: "Strom", gas: "Gas", water: "Wasser", fuel: "Kraftstoff" },
};
const COLORS = { electricity: "#5AA9E0", gas: "#E0643A", water: "#4FD1B0", fuel: "#F2A93B" };
const PALETTE = ["#5AA9E0", "#E0643A", "#4FD1B0", "#F2A93B", "#9FB3C4", "#B48EAD"];
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

class UtilityCostsCard extends HTMLElement {
  static getStubConfig() { return { show_media: true, show_year: true }; }
  setConfig(config) { this._cfg = { show_media: true, show_year: true, ...(config || {}) }; this._draw(); }
  getCardSize() { return 4; }
  getGridOptions() { return { columns: 6, min_columns: 4, rows: 4 }; }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first || Date.now() - (this._at || 0) > 15 * 60 * 1000) this._fetch();
  }

  get lang() { return ((this._hass?.locale?.language || this._hass?.language || "en").split("-")[0]); }
  get t() { return L[this.lang] || L.en; }

  async _fetch() {
    this._at = Date.now();
    try { this._d = await this._hass.callWS({ type: "utility_costs/overview" }); this._err = ""; }
    catch (e) { this._err = e.message || String(e); }
    this._draw();
  }

  money(v, cur) {
    if (v === null || v === undefined) return "–";
    try { return new Intl.NumberFormat(this._hass?.locale?.language || "en", { style: "currency", currency: cur || "EUR", maximumFractionDigits: 0 }).format(v); }
    catch (e) { return `${Math.round(v)} ${cur || ""}`; }
  }

  _draw() {
    if (!this._cfg) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const t = this.t, d = this._d, cur = d?.currency;
    let body;
    if (this._err) body = `<div class="muted">${esc(this._err)}</div>`;
    else if (!d) body = `<div class="muted">…</div>`;
    else if (d.month_cost === undefined) body = `<div class="muted">${esc(t.none)}</div>`;
    else {
      const info = Object.fromEntries((d.media_info || []).map((m, i) => [m.id, { ...m, i }]));
      const name = (id) => info[id]?.name || (MEDIA[this.lang] || MEDIA.en)[id] || id;
      const color = (id) => COLORS[id] || PALETTE[(info[id]?.i || 0) % PALETTE.length];
      const ids = Object.keys(d.media || {}).filter((id) => d.media[id].month_forecast || d.media[id].ytd);
      const maxM = Math.max(1, ...ids.map((id) => d.media[id].month_forecast || 0));
      const monthName = new Date(`${d.month}-01T00:00:00`).toLocaleDateString(this._hass?.locale?.language || "en", { month: "long" });
      const diff = d.prev_ytd ? ((d.ytd - d.prev_ytd) / d.prev_ytd) * 100 : null;
      body = `<div class="top"><div><div class="lbl">${esc(t.month)} · ${esc(monthName.charAt(0).toUpperCase() + monthName.slice(1))}</div><div class="big">${this.money(d.month_cost, cur)}</div>
          <div class="sub">${esc(t.forecast)}: ${this.money(d.month_forecast, cur)}</div></div>
          ${this._cfg.show_year ? `<div class="r"><div class="lbl">${esc(t.year_fc)}</div><div class="mid">${this.money(d.year_forecast, cur)}</div>
          <div class="sub">${esc(t.ytd)}: ${this.money(d.ytd, cur)}${diff !== null ? ` <span class="${diff > 0 ? "up" : "down"}">${diff > 0 ? "▲" : "▼"}${Math.abs(diff).toFixed(0)}%</span>` : ""}</div>
          ${d.prev_year_total ? `<div class="sub">${esc(t.prev)}: ${this.money(d.prev_year_total, cur)}</div>` : ""}</div>` : ""}</div>
        ${this._cfg.show_media ? `<div class="media">${ids.map((id) => { const m = d.media[id]; return `<div class="m"><span class="nm"><i style="background:${color(id)}"></i>${esc(name(id))}</span>
          <span class="bar"><span style="width:${(m.month_cost / maxM) * 100}%;background:${color(id)}"></span><span class="fc" style="width:${(Math.max(0, m.month_forecast - m.month_cost) / maxM) * 100}%;background:${color(id)}"></span></span>
          <b>${this.money(m.month_cost, cur)}</b></div>`; }).join("")}</div>` : ""}`;
    }
    this.shadowRoot.innerHTML = `<style>
      ha-card { padding:16px; cursor:pointer; }
      .h { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:16px; font-weight:500; }
      .h ha-icon { color: var(--secondary-text-color); --mdc-icon-size:20px; }
      .top { display:flex; justify-content:space-between; gap:12px; }
      .lbl { font-size:12px; color: var(--secondary-text-color); }
      .big { font-size:30px; font-weight:500; line-height:1.15; } .mid { font-size:20px; font-weight:500; line-height:1.3; }
      .sub { font-size:12px; color: var(--secondary-text-color); margin-top:2px; } .r { text-align:right; }
      .up { color: var(--error-color, #E0643A); } .down { color: var(--success-color, #4FB477); }
      .media { margin-top:14px; display:grid; gap:8px; }
      .m { display:grid; grid-template-columns: 90px 1fr auto; gap:10px; align-items:center; font-size:13px; }
      .nm { display:flex; align-items:center; gap:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .nm i { width:8px; height:8px; border-radius:50%; display:inline-block; flex:none; }
      .bar { display:flex; height:8px; border-radius:4px; background: var(--secondary-background-color, rgba(127,127,127,.15)); overflow:hidden; }
      .bar span { display:block; height:100%; } .bar .fc { opacity:.3; }
      .muted { color: var(--secondary-text-color); }
    </style><ha-card><div class="h"><span>${esc(this._cfg.title || t.title)}</span><ha-icon icon="mdi:cash-multiple"></ha-icon></div>${body}</ha-card>`;
    this.shadowRoot.querySelector("ha-card").onclick = () => {
      history.pushState(null, "", "/utility-costs");
      window.dispatchEvent(new CustomEvent("location-changed"));
    };
  }
}

if (!customElements.get("utility-costs-card")) {
  customElements.define("utility-costs-card", UtilityCostsCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "utility-costs-card", name: "Utility Costs", description: "Cost of the current month and a forecast for the year", preview: true });
}
