/* Utility Costs panel: invoices, instalments, tariffs, readings, corrections,
 * investments (ROI) and settings. Plain web components, no build step.
 * Split into modules so each file stays small; the version query of this
 * module is passed on to the others for cache busting.
 */
const V = new URL(import.meta.url).search;
const [{ I18N }, { CSS }, { makeExt }, { makeMore }] = await Promise.all([
  import(`./uc-i18n.js${V}`), import(`./uc-css.js${V}`), import(`./uc-ext.js${V}`), import(`./uc-more.js${V}`),
]);
const getP = (o, path) => path.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
const setP = (o, path, v) => {
  const ks = path.split("."); let a = o;
  ks.slice(0, -1).forEach((k, i) => { if (a[k] == null) a[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; a = a[k]; });
  const last = ks[ks.length - 1];
  if (v === undefined) { if (Array.isArray(a)) a.splice(Number(last), 1); else delete a[last]; } else a[last] = v;
};
const uid = (p) => p + Math.random().toString(36).slice(2, 9);
const DOMAIN = "utility_costs";
const COLORS = { electricity: "#5AA9E0", gas: "#E0643A", water: "#4FD1B0", fuel: "#F2A93B" };
const PALETTE = ["#5AA9E0", "#E0643A", "#4FD1B0", "#F2A93B", "#9FB3C4", "#B48EAD"];

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

class UtilityCostsPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._tab = "summary";
    this._year = new Date().getFullYear();
    this._medium = "";
    this._data = null;
    this._summary = null;
    this._dialog = null;
    this._msg = "";
    // The module finishes loading (top-level await) after Home Assistant has
    // already created the element and assigned hass/narrow/panel to it. Those
    // values then sit as own properties that shadow our setters - re-apply them.
    for (const k of ["hass", "narrow", "panel", "route"]) {
      if (Object.prototype.hasOwnProperty.call(this, k)) { const v = this[k]; delete this[k]; this[k] = v; }
    }
  }

  connectedCallback() { if (this._hass && !this._data) this._load(); }

  get hass() { return this._hass; }
  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._load();
    const mb = this.shadowRoot.querySelector("ha-menu-button");
    if (mb) mb.hass = hass;
  }
  set narrow(v) { this._narrow = v; const mb = this.shadowRoot.querySelector("ha-menu-button"); if (mb) mb.narrow = v; }
  set panel(p) { this._panel = p; }

  get t() {
    const lang = ((this._hass && (this._hass.locale?.language || this._hass.language)) || "en").split("-")[0];
    return I18N[lang] || I18N.en;
  }
  get locale() { return (this._hass && (this._hass.locale?.language || this._hass.language)) || "en"; }
  get admin() { return !!this._hass?.user?.is_admin; }
  get settings() { return this._data?.settings || { media: [], currency: "EUR" }; }
  get media() { return this.settings.media || []; }

  mName(id) { const m = this.media.find((x) => x.id === id); return (m && m.name) || this.t.media[id] || id || ""; }
  zName(mid, zid) {
    const m = this.media.find((x) => x.id === mid);
    const z = m && (m.zones || []).find((x) => x.id === zid);
    return (z && z.name) || this.t.zones[zid] || zid;
  }
  unit(mid) { const m = this.media.find((x) => x.id === mid); return (m && m.unit) || ""; }
  zones(mid) { const m = this.media.find((x) => x.id === mid); return ((m && m.zones) || [{ id: "all" }]).map((z) => z.id); }
  color(mid) { const i = this.media.findIndex((x) => x.id === mid); return COLORS[mid] || PALETTE[i % PALETTE.length] || "#888"; }

  num(v, d = 2) {
    if (v === null || v === undefined || v === "" || isNaN(Number(v))) return this.t.unknown;
    return new Intl.NumberFormat(this.locale, { minimumFractionDigits: d, maximumFractionDigits: d }).format(Number(v));
  }
  money(v) { return this.num(v, 2); }
  date(v) { if (!v) return ""; const d = new Date(v + "T00:00:00"); return isNaN(d) ? esc(v) : d.toLocaleDateString(this.locale); }

  async ws(msg) { return this._hass.callWS({ ...msg, type: `${DOMAIN}/${msg.type}` }); }

  async _load() {
    try {
      this._data = await this.ws({ type: "get_all" });
      if (this._tab === "summary") await this._loadSummary();
      if (this._tab === "investments") await this._loadRoi();
    } catch (e) { this._msg = `${this.t.error}: ${e.message || e}`; }
    this._render();
  }
  async _loadSummary(force = false) {
    if (!force) this._summary = null;
    this._busy = force;
    this._render();
    const seq = (this._sumSeq = (this._sumSeq || 0) + 1);
    try {
      const [cur, prev] = await Promise.all([this.ws({ type: "summary", year: Number(this._year), force }),
        this.ws({ type: "summary", year: Number(this._year) - 1 }).catch(() => null)]);
      if (seq !== this._sumSeq) return;
      this._summary = cur; this._prev = prev;
    } catch (e) { this._msg = `${this.t.error}: ${e.message || e}`; }
    this._busy = false;
  }

  /* ---------- field specs ---------- */
  spec(col) {
    const mediumSel = { key: "medium", type: "medium" };
    const sup = { key: "supplier_id", type: "supplier" };
    switch (col) {
      case "invoices": return [mediumSel, sup, { key: "kind", type: "select", options: Object.keys(this.t.kinds), labels: this.t.kinds },
        { key: "number", type: "text" }, { key: "issue_date", type: "date" }, { key: "due_date", type: "date" },
        { key: "period_from", type: "date", req: true }, { key: "period_to", type: "date", req: true },
        { key: "quantities", type: "zones", hint: true }, { key: "amount", type: "number", req: true }, { key: "balance", type: "number" },
        { key: "reading_start", type: "number" }, { key: "reading_end", type: "number" }, { key: "estimated", type: "bool" }, { key: "note", type: "textarea" }];
      case "installments": return [mediumSel, sup, { key: "period_from", type: "date" }, { key: "period_to", type: "date" },
        { key: "due_date", type: "date" }, { key: "forecast_qty", type: "number" }, { key: "amount", type: "number", req: true },
        { key: "paid", type: "bool" }, { key: "note", type: "textarea" }];
      case "tariffs": return [mediumSel, sup, { key: "name", type: "text" }, { key: "valid_from", type: "date", req: true }, { key: "valid_to", type: "date" },
        { key: "prices", type: "zones", step: "0.0001" }, { key: "fixed_monthly", type: "number" },
        { key: "price_basis", type: "select", options: ["unit", "kwh"], labels: this.t.basis }, { key: "kwh_per_unit", type: "number" }, { key: "note", type: "textarea" }];
      case "readings": return [mediumSel, { key: "date", type: "date", req: true }, { key: "value", type: "number", req: true }, { key: "source", type: "text" }, { key: "note", type: "textarea" }];
      case "corrections": return [mediumSel, { key: "month", type: "month", req: true }, { key: "zone", type: "zone" }, { key: "qty", type: "number", req: true }, { key: "reason", type: "text" }];
      case "investments": return [...(this.projects.length > 1 ? [{ key: "project_id", type: "project" }] : []), { key: "date", type: "date", req: true }, { key: "amount", type: "number", req: true },
        { key: "category", type: "select", options: Object.keys(this.t.cats), labels: this.t.cats }, { key: "description", type: "text", req: true }, { key: "comment", type: "textarea" }];
      case "suppliers": return [mediumSel, { key: "name", type: "text", req: true }, { key: "customer_no", type: "text" }, { key: "tariff_group", type: "text" }, { key: "note", type: "textarea" }];
      default: return [];
    }
  }

  columns(col) {
    const t = this.t;
    const qty = (r) => Object.entries(r.quantities || {}).map(([z, v]) => `${this.num(v, 1)}${this.zones(r.medium).length > 1 && z !== "total" ? " " + esc(this.zName(r.medium, z)) : ""}`).join(" + ");
    const sup = (r) => esc((this._data.suppliers.find((s) => s.id === r.supplier_id) || {}).name || "");
    switch (col) {
      case "invoices": return [
        [t.f.medium, (r) => `<span class="dot" style="background:${this.color(r.medium)}"></span>${esc(this.mName(r.medium))}`],
        [t.f.supplier_id, sup],
        [t.f.period_from, (r) => `${this.date(r.period_from)} – ${this.date(r.period_to)}`],
        ["📎", (r) => { const a = r.attachments || []; return a.length ? `<button class="link attn" data-edit="${esc(r.id)}" title="${esc(a.map((x) => x.name).join("\n"))}">📎${a.length > 1 ? `<b>${a.length}</b>` : ""}</button>` : ""; }, "c"],
        [t.f.quantities, (r) => `${qty(r)} ${esc(this.unit(r.medium))}`, "r"],
        [t.vs_ha, (r) => this.devCell(r.id), "r"],
        [t.f.amount, (r) => this.money(r.amount), "r"],
        [t.f.balance, (r) => r.balance === undefined || r.balance === null || r.balance === "" ? "" : `<span class="${Number(r.balance) < 0 ? "neg" : "pos"}">${this.money(r.balance)}</span>`, "r"],
        [t.f.note, (r) => esc(r.note || "")],
      ];
      case "installments": return [
        [t.f.medium, (r) => esc(this.mName(r.medium))], [t.f.supplier_id, sup],
        [t.f.period_from, (r) => `${this.date(r.period_from)} – ${this.date(r.period_to)}`],
        [t.f.due_date, (r) => this.date(r.due_date)],
        [t.f.forecast_qty, (r) => `${this.num(r.forecast_qty, 0)} ${esc(this.unit(r.medium))}`, "r"],
        [t.f.amount, (r) => this.money(r.amount), "r"],
        [t.f.paid, (r) => (r.paid === true ? t.yes : r.paid === false ? t.no : t.unknown)],
      ];
      case "tariffs": return [
        [t.f.medium, (r) => esc(this.mName(r.medium))], [t.f.name, (r) => esc(r.name || "")],
        [t.f.valid_from, (r) => `${this.date(r.valid_from)} – ${r.valid_to ? this.date(r.valid_to) : "…"}`],
        [t.f.prices, (r) => Object.entries(r.prices || {}).map(([z, v]) => `${this.num(v, 4)}${this.zones(r.medium).length > 1 ? " " + esc(this.zName(r.medium, z)) : ""}`).join(" · "), "r"],
        [t.f.fixed_monthly, (r) => this.money(r.fixed_monthly), "r"],
        [t.f.note, (r) => esc(r.note || "")],
      ];
      case "readings": return [[t.f.medium, (r) => esc(this.mName(r.medium))], [t.f.date, (r) => this.date(r.date)],
        [t.f.value, (r) => `${this.num(r.value, 3)} ${esc(this.unit(r.medium))}`, "r"], [t.f.source, (r) => esc(r.source || "")], [t.f.note, (r) => esc(r.note || "")]];
      case "corrections": return [[t.f.medium, (r) => esc(this.mName(r.medium))], [t.f.month, (r) => esc(r.month)],
        [t.f.zone, (r) => esc(this.zName(r.medium, r.zone || "all"))], [t.f.qty, (r) => `${this.num(r.qty, 2)} ${esc(this.unit(r.medium))}`, "r"], [t.f.reason, (r) => esc(r.reason || "")]];
      case "investments": return [[t.f.date, (r) => this.date(r.date)], [t.f.category, (r) => esc(t.cats[r.category] || r.category || "")],
        [t.f.description, (r) => esc(r.description || "")], [t.f.comment, (r) => esc(r.comment || "")], [t.f.amount, (r) => this.money(r.amount), "r"]];
      case "suppliers": return [[t.f.medium, (r) => esc(this.mName(r.medium))], [t.f.name, (r) => esc(r.name)], [t.f.customer_no, (r) => esc(r.customer_no || "")], [t.f.tariff_group, (r) => esc(r.tariff_group || "")]];
      default: return [];
    }
  }

  card(col, r) {
    const t = this.t;
    const sup = (this._data.suppliers.find((x) => x.id === r.supplier_id) || {}).name || "";
    const per = (a, b) => `${this.date(a)} – ${b ? this.date(b) : esc(t.open_end)}`;
    const unit = esc(this.unit(r.medium));
    const multi = this.zones(r.medium).length > 1;
    let title = esc(this.mName(r.medium)), sub = "", value = "", vsub = "", chips = [], meta = [], note = r.note || "";
    const chip = (txt, cls = "") => `<span class="chip ${cls}">${txt}</span>`;
    switch (col) {
      case "invoices": {
        sub = esc(sup) + (r.number ? ` · ${esc(r.number)}` : "");
        value = this.money(r.amount);
        chips.push(chip("📅 " + per(r.period_from, r.period_to)));
        if ((r.attachments || []).length) chips.push(`<span class="chip att" title="${esc(r.attachments.map((x) => x.name).join("\n"))}">📎 ${r.attachments.length}</span>`);
        const q = Object.entries(r.quantities || {}).map(([z, v]) => `${this.num(v, 1)}${multi && z !== "total" ? " " + esc(this.zName(r.medium, z)) : ""}`).join(" + ");
        if (q) chips.push(chip(`${q} ${unit}`));
        const d = this.devCell(r.id); if (d) chips.push(chip(`${esc(t.vs_ha)} ${d}`));
        if (r.balance !== undefined && r.balance !== null && r.balance !== "") vsub = `<span class="${Number(r.balance) < 0 ? "neg" : "pos"}">${Number(r.balance) > 0 ? "+" : ""}${this.money(r.balance)}</span>`;
        break;
      }
      case "installments":
        sub = esc(sup); value = this.money(r.amount);
        if (r.due_date) chips.push(chip("⏰ " + this.date(r.due_date)));
        if (r.period_from) chips.push(chip("📅 " + per(r.period_from, r.period_to)));
        if (r.forecast_qty) chips.push(chip(`${this.num(r.forecast_qty, 0)} ${unit}`));
        chips.push(chip(`${esc(t.f.paid)}: ${r.paid === true ? "✓ " + esc(t.yes) : r.paid === false ? esc(t.no) : esc(t.unknown)}`, r.paid === true ? "ok" : r.paid === false ? "bad" : ""));
        break;
      case "tariffs":
        sub = esc(r.name || "");
        value = this.money(r.fixed_monthly); vsub = `<span class="muted">${esc(t.f.fixed_monthly)}</span>`;
        chips.push(chip("📅 " + per(r.valid_from, r.valid_to), r.valid_to ? "" : "ok"));
        for (const [z, v] of Object.entries(r.prices || {})) chips.push(chip(`${multi ? esc(this.zName(r.medium, z)) + " " : ""}<b>${this.num(v, 4)}</b> /${r.price_basis === "kwh" ? "kWh" : unit}`, "price"));
        break;
      case "readings":
        value = `${this.num(r.value, 3)} ${unit}`; chips.push(chip("📅 " + this.date(r.date))); if (r.source) chips.push(chip(esc(r.source)));
        break;
      case "corrections":
        value = `${Number(r.qty) > 0 ? "+" : ""}${this.num(r.qty, 2)} ${unit}`; chips.push(chip("📅 " + esc(r.month)));
        if (multi) chips.push(chip(esc(this.zName(r.medium, r.zone || "all")))); note = r.reason || "";
        break;
      case "investments":
        title = esc(r.description || t.cats[r.category] || ""); sub = esc(t.cats[r.category] || r.category || "");
        value = this.money(r.amount); chips.push(chip("📅 " + this.date(r.date))); note = r.comment || "";
        break;
      case "suppliers":
        sub = esc(r.name); if (r.tariff_group) chips.push(chip(esc(r.tariff_group))); if (r.customer_no) chips.push(chip("# " + esc(r.customer_no)));
        break;
    }
    const dot = "";
    return `<div class="card" style="--mc:${col === "investments" ? "var(--primary-color)" : this.color(r.medium)}" ${this.admin ? `data-edit="${esc(r.id)}"` : ""}>
      <div class="ctop"><div class="ctitle">${dot}<div><div class="cname">${title}</div>${sub ? `<div class="csub">${sub}</div>` : ""}</div></div>
      <div class="cval">${value ? `<div class="camt">${value}</div>` : ""}${vsub ? `<div class="cvsub">${vsub}</div>` : ""}</div>${this.admin ? `<span class="chev">›</span>` : ""}</div>
      ${chips.length ? `<div class="chips">${chips.join("")}</div>` : ""}${note ? `<div class="cnote">${esc(note)}</div>` : ""}</div>`;
  }

  devCell(id) {
    const c = this._summary?.checks?.[id] || this._checks?.[id];
    if (!c || c.deviation_pct === null || c.deviation_pct === undefined) return "";
    const p = c.deviation_pct;
    const cls = Math.abs(p) >= 10 ? "warn" : "muted";
    return `<span class="${cls}" title="${esc(this.t.ha)}: ${this.num(c.ha_total, 1)} · ${esc(this.t.coverage.replace("{p}", Math.round(c.coverage * 100)))}">${p > 0 ? "+" : ""}${this.num(p, 0)}%</span>`;
  }

  rowYear(col, r) {
    const pick = { invoices: r.issue_date || r.period_to, installments: r.due_date || r.period_to || r.period_from, tariffs: null, readings: r.date, corrections: r.month, suppliers: null, investments: null }[col];
    return pick ? Number(String(pick).slice(0, 4)) : null;
  }

  /* ---------- render ---------- */
  _render() {
    const t = this.t;
    const tabs = Object.keys(t.tabs).map((k) => `<button class="tab ${k === this._tab ? "on" : ""}" data-tab="${k}">${esc(t.tabs[k])}</button>`).join("");
    const years = [];
    const now = new Date().getFullYear();
    for (let y = now + 1; y >= now - 10; y--) years.push(y);
    const yr = Number(this._year);
    const yearSel = `<span class="ystep"><button type="button" class="yarr" data-ystep="-1" ${yr <= years[years.length - 1] ? "disabled" : ""} aria-label="${esc(String(yr - 1))}">‹</button><select id="year">${years.map((y) => `<option ${y === yr ? "selected" : ""}>${y}</option>`).join("")}</select><button type="button" class="yarr" data-ystep="1" ${yr >= years[0] ? "disabled" : ""} aria-label="${esc(String(yr + 1))}">›</button></span>`;
    const medSel = `<select id="medium"><option value="">${esc(t.all)}</option>${this.media.map((m) => `<option value="${esc(m.id)}" ${m.id === this._medium ? "selected" : ""}>${esc(this.mName(m.id))}</option>`).join("")}</select>`;
    let body = "";
    if (!this._data) body = `<p class="muted">${esc(t.loading)}</p>`;
    else if (this._tab === "summary") body = this.renderSummary();
    else if (this._tab === "settings") body = this.renderSettings();
    else if (this._tab === "investments") body = this.renderInvest();
    else body = this.renderList(this._tab);
    const filters = this._tab === "settings" ? "" : `<div class="filters">${["tariffs", "suppliers", "investments"].includes(this._tab) ? "" : `<label>${esc(t.year)} ${yearSel}</label>`}${["summary", "investments"].includes(this._tab) ? "" : `<label>${esc(t.f.medium)} ${medSel}</label>`}
      ${this._tab !== "summary" && this.admin ? `<button class="primary" id="add">+ ${esc(t.add)}</button>` : ""}${this.admin && this.importable(this._tab) ? `<button id="impbtn">⬆ ${esc(this.tm.import_b)}</button>` : ""}</div>`;
    this.shadowRoot.innerHTML = `<style>${CSS}</style>
      <div class="toolbar"><ha-menu-button></ha-menu-button><div class="title">${esc(t.title)}</div></div>
      <div class="tabs">${tabs}</div>
      <div class="content">${this._msg ? `<div class="msg">${esc(this._msg)}</div>` : ""}${!this.admin ? `<p class="muted">${esc(t.readonly)}</p>` : ""}${filters}${body}</div>
      ${!["summary", "settings"].includes(this._tab) && this.admin && this._data ? `<button class="fab" id="fab" aria-label="${esc(t.add)}">+</button>` : ""}
      ${this._dialog ? this.renderDialog() : ""}${this._pd ? this.renderProjDialog() : ""}${this._imp ? this.renderImport() : ""}`;
    const mb = this.shadowRoot.querySelector("ha-menu-button");
    if (mb) { mb.hass = this._hass; mb.narrow = this._narrow; }
    this._bind();
    this.shadowRoot.querySelector(".tab.on")?.scrollIntoView({ block: "nearest", inline: "center" });
  }

  renderList(col) {
    const t = this.t;
    let rows = col === "investments" ? (this.projects.length ? this.projInvestments(this._proj) : this._data.investments || []) : (this._data[col] || []).filter((r) => !this._medium || r.medium === this._medium);
    if (!["tariffs", "suppliers", "investments"].includes(col)) rows = rows.filter((r) => { const y = this.rowYear(col, r); return y === null || y === Number(this._year); });
    const key = { invoices: "period_to", installments: "period_from", tariffs: "valid_from", readings: "date", corrections: "month", suppliers: "name", investments: "date" }[col];
    rows.sort((a, b) => String(b[key] || "").localeCompare(String(a[key] || "")));
    if (!rows.length) return `<p class="muted">${esc(t.no_data)}</p>`;
    const cols = this.columns(col);
    let foot = "";
    if (col === "investments") {
      const sum = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
      foot = `<tr class="foot"><td colspan="${cols.length - 1}">${esc(t.total)}</td><td class="r">${this.money(sum)}</td>${this.admin ? "<td></td>" : ""}</tr>`;
    }
    if (col === "invoices" || col === "installments") {
      const sum = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
      foot = `<tr class="foot"><td colspan="${cols.length - (col === "invoices" ? 3 : 2)}">${esc(t.total)}</td><td class="r">${this.money(sum)}</td><td colspan="${col === "invoices" ? 2 : 1}"></td>${this.admin ? "<td></td>" : ""}</tr>`;
    }
    const sumAmt = ["invoices", "installments", "investments"].includes(col) ? rows.reduce((s, r) => s + Number(r.amount || 0), 0) : null;
    const cards = rows.map((r) => this.card(col, r)).join("");
    return `<div class="tablewrap desk"><table><thead><tr>${cols.map((c) => `<th class="${c[2] || ""}">${esc(c[0])}</th>`).join("")}${this.admin ? "<th></th>" : ""}</tr></thead><tbody>
      ${rows.map((r) => `<tr>${cols.map((c) => `<td class="${c[2] || ""}">${c[1](r)}</td>`).join("")}${this.admin ? `<td class="act"><button class="link" data-edit="${esc(r.id)}">${esc(t.edit)}</button><button class="link danger" data-del="${esc(r.id)}">${esc(t.del)}</button></td>` : ""}</tr>`).join("")}
      ${foot}</tbody></table></div>
      <div class="cards mob">${sumAmt !== null ? `<div class="tot"><span>${esc(t.total)} · ${rows.length}</span><b>${this.money(sumAmt)} ${esc(this.settings.currency || "")}</b></div>` : ""}${cards}</div>`;
  }

  renderSummary() {
    const t = this.t;
    const s = this._summary;
    if (!s) return `<p class="muted">${esc(t.loading)}</p>`;
    const media = this.media;
    const cur = esc(this.settings.currency || "");
    const head = `<tr><th>${esc(t.month)}</th>${media.map((m) => `<th class="r" colspan="2"><span class="dot" style="background:${this.color(m.id)}"></span>${esc(this.mName(m.id))}</th>`).join("")}<th class="r">${esc(t.total)} ${cur}</th></tr>`;
    let max = 1;
    s.months.forEach((mo) => { max = Math.max(max, media.reduce((a, m) => a + (mo.media[m.id]?.cost || 0), 0)); });
    const rows = s.months.map((mo) => {
      const tot = media.reduce((a, m) => a + (mo.media[m.id]?.cost || 0), 0);
      const name = new Date(mo.month + "-01T00:00:00").toLocaleDateString(this.locale, { month: "short" });
      const bar = media.map((m) => `<span style="background:${this.color(m.id)};width:${((mo.media[m.id]?.cost || 0) / max) * 100}%"></span>`).join("");
      return `<tr><td>${esc(name)}</td>${media.map((m) => { const x = mo.media[m.id] || {}; const part = x.days && x.data_days < x.days ? ` title="${x.data_days}/${x.days}"` : ""; return `<td class="r muted"${part}>${this.num(x.qty_total, 1)} ${esc(m.unit || "")}</td><td class="r">${this.money(x.cost)}</td>`; }).join("")}<td class="r b">${this.money(tot)}<div class="bar">${bar}</div></td></tr>`;
    }).join("");
    const n = s.months.length || 1;
    const tm = media.map((m) => s.totals[m.id] || {});
    const totRow = `<tr class="foot"><td>${esc(t.meter_cost)}</td>${tm.map((x) => `<td></td><td class="r">${this.money(x.meter_cost)}</td>`).join("")}<td class="r b">${this.money(s.meter_total)}</td></tr>
      <tr class="foot"><td>${esc(t.per_month)}</td>${tm.map((x) => `<td></td><td class="r">${this.money((x.meter_cost || 0) / n)}</td>`).join("")}<td class="r">${this.money(s.meter_total / n)}</td></tr>
      <tr class="foot"><td>${esc(t.invoice_amount)}</td>${tm.map((x) => `<td class="r muted">${this.num(x.invoice_qty, 0)}</td><td class="r">${this.money(x.invoice_amount)}</td>`).join("")}<td class="r b">${this.money(s.invoice_total)}</td></tr>
      <tr class="foot"><td>${esc(t.balance_sum)}</td>${tm.map((x) => `<td></td><td class="r ${x.balance < 0 ? "neg" : x.balance > 0 ? "pos" : ""}">${x.balance ? this.money(x.balance) : ""}</td>`).join("")}<td></td></tr>`;
    const checks = (s.invoices || []).slice().sort((a, b) => String(a.medium).localeCompare(b.medium) || String(a.period_from).localeCompare(b.period_from)).map((inv) => {
      const c = s.checks[inv.id] || {};
      const iq = Object.values(inv.quantities || {}).reduce((a, v) => a + Number(v || 0), 0);
      return `<tr><td><span class="dot" style="background:${this.color(inv.medium)}"></span>${esc(this.mName(inv.medium))}</td><td>${this.date(inv.period_from)} – ${this.date(inv.period_to)}</td><td class="r">${this.num(iq, 1)}</td><td class="r muted">${this.num(c.ha_total, 1)}</td><td class="r">${this.devCell(inv.id)}</td><td class="r">${this.money(inv.amount)}</td></tr>`;
    }).join("");
    const kpi = `<div class="kpis"><div class="kpi"><span>${esc(t.meter_cost)}</span><b>${this.money(s.meter_total)}</b><small>${esc(t.per_month)}: ${this.money(s.meter_total / n)}</small></div>
      <div class="kpi"><span>${esc(t.invoice_amount)}</span><b>${this.money(s.invoice_total)}</b><small>${cur}</small></div>
      ${media.map((m) => { const x = s.totals[m.id] || {}; return `<div class="kpi" style="border-top-color:${this.color(m.id)}"><span>${esc(this.mName(m.id))}</span><b>${this.money(x.meter_cost)}</b><small>${esc(t.invoice)}: ${this.money(x.invoice_amount)}${x.balance ? ` · <span class="${x.balance < 0 ? "neg" : "pos"}">${this.money(x.balance)}</span>` : ""}</small></div>`; }).join("")}</div>`;
    const mcards = s.months.slice().reverse().map((mo) => {
      const tot = media.reduce((a, m) => a + (mo.media[m.id]?.cost || 0), 0);
      const name = new Date(mo.month + "-01T00:00:00").toLocaleDateString(this.locale, { month: "long" });
      const bar = media.map((m) => `<span style="background:${this.color(m.id)};width:${((mo.media[m.id]?.cost || 0) / max) * 100}%"></span>`).join("");
      return `<div class="card"><div class="chead"><span>${esc(name)}</span><span class="camt">${this.money(tot)}</span></div><div class="bar big">${bar}</div>
        <div class="chips">${media.map((m) => { const x = mo.media[m.id] || {}; return `<span class="chip"><span class="dot" style="background:${this.color(m.id)}"></span>${esc(this.mName(m.id))} ${this.money(x.cost)} <small>${this.num(x.qty_total, 1)} ${esc(m.unit || "")}</small></span>`; }).join("")}</div></div>`;
    }).join("");
    const ccards = (s.invoices || []).slice().sort((a, b) => String(b.period_to).localeCompare(a.period_to)).map((inv) => {
      const c = s.checks[inv.id] || {};
      const iq = Object.values(inv.quantities || {}).reduce((a, v) => a + Number(v || 0), 0);
      return `<div class="card"><div class="chead"><span><span class="dot" style="background:${this.color(inv.medium)}"></span>${esc(this.mName(inv.medium))}</span><span>${this.devCell(inv.id)}</span></div>
        <dl><dt>${esc(t.f.period_from)}</dt><dd>${this.date(inv.period_from)} – ${this.date(inv.period_to)}</dd><dt>${esc(t.invoice)} / ${esc(t.ha)}</dt><dd>${this.num(iq, 1)} / ${this.num(c.ha_total, 1)} ${esc(this.unit(inv.medium))}</dd><dt>${esc(t.f.amount)}</dt><dd>${this.money(inv.amount)}</dd></dl></div>`;
    }).join("");
    const at = s._meta?.computed_at ? new Date(s._meta.computed_at).toLocaleString(this.locale, { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
    const meta = `<div class="sumbar"><span class="muted">${at ? `${esc(t.computed_at)}: ${esc(at)}` : ""}</span><span class="sp"></span>${this.exportBtns()}${this.admin ? `<button class="small" id="recalc" ${this._busy ? "disabled" : ""}>${this._busy ? esc(t.recalculating) : "⟳ " + esc(t.recalc)}</button>` : ""}</div>`;
    return `${meta}${kpi}${this.sumChart(s, this._prev)}<div class="tablewrap desk"><table class="sum"><thead>${head}</thead><tbody>${rows}${totRow}</tbody></table></div>
      <div class="cards mob">${mcards}</div>
      <h3>${esc(t.checks)}</h3>
      <div class="cards mob">${ccards}</div>
      ${checks ? `<div class="tablewrap desk"><table><thead><tr><th>${esc(t.f.medium)}</th><th>${esc(t.f.period_from)}</th><th class="r">${esc(t.invoice)}</th><th class="r">${esc(t.ha)}</th><th class="r">${esc(t.vs_ha)}</th><th class="r">${esc(t.f.amount)}</th></tr></thead><tbody>${checks}</tbody></table></div>` : `<p class="muted">${esc(t.no_data)}</p>`}`;
  }

  renderSettings() {
    const t = this.t;
    const ro = this.admin ? "" : "readonly";
    return `<label class="block">${esc(t.settings_json)}<textarea id="settings" rows="18" ${ro}>${esc(JSON.stringify(this.settings, null, 2))}</textarea></label>
      ${this.admin ? `<button class="primary" id="savesettings">${esc(t.save)}</button>` : ""}
      <h3>${esc(t.import)} / ${esc(t.export)}</h3>
      <button id="export">${esc(t.export)}</button>
      ${this.admin ? `<label class="block">${esc(t.import_json)}<textarea id="importdata" rows="6"></textarea></label>
      <select id="importmode"><option value="merge">${esc(t.mode_merge)}</option><option value="replace">${esc(t.mode_replace)}</option></select>
      <button class="primary" id="import">${esc(t.import)}</button>` : ""}`;
  }

  renderDialog() {
    const t = this.t;
    const d = this._dialog;
    const item = d.item;
    const suppliers = this._data.suppliers.filter((s) => s.medium === item.medium);
    const field = (f) => {
      const label = esc(t.f[f.key] || f.key);
      const v = item[f.key];
      switch (f.type) {
        case "medium": return `<label>${label}<select data-k="medium">${this.media.map((m) => `<option value="${esc(m.id)}" ${m.id === item.medium ? "selected" : ""}>${esc(this.mName(m.id))}</option>`).join("")}</select></label>`;
        case "supplier": return `<label>${label}<select data-k="supplier_id"><option value=""></option>${suppliers.map((s) => `<option value="${esc(s.id)}" ${s.id === v ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></label>`;
        case "select": return `<label>${label}<select data-k="${f.key}"><option value=""></option>${f.options.map((o) => `<option value="${o}" ${o === v ? "selected" : ""}>${esc(f.labels[o] || o)}</option>`).join("")}</select></label>`;
        case "project": return `<label>${label}<select data-k="project_id">${this.projects.map((p) => `<option value="${esc(p.id)}" ${p.id === v ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label>`;
        case "zone": return `<label>${label}<select data-k="zone">${this.zones(item.medium).map((z) => `<option value="${esc(z)}" ${z === (v || "all") ? "selected" : ""}>${esc(this.zName(item.medium, z))}</option>`).join("")}</select></label>`;
        case "bool": return `<label class="chk"><input type="checkbox" data-k="${f.key}" ${v ? "checked" : ""}> ${label}</label>`;
        case "textarea": return `<label class="wide">${label}<textarea data-k="${f.key}" rows="2">${esc(v || "")}</textarea></label>`;
        case "zones": {
          const obj = v || {};
          const keys = this.zones(item.medium).slice();
          Object.keys(obj).forEach((k) => { if (!keys.includes(k)) keys.push(k); });
          const unit = f.key === "prices" ? `${esc(this.settings.currency || "")}/${esc(this.unit(item.medium))}` : esc(this.unit(item.medium));
          return `<fieldset class="wide"><legend>${label} (${unit})</legend><div class="zones">${keys.map((z) => `<label>${esc(this.zName(item.medium, z))}<input type="number" step="${f.step || "any"}" data-zone="${f.key}" data-z="${esc(z)}" value="${obj[z] ?? ""}"></label>`).join("")}
            ${f.hint ? `<button type="button" class="link" id="hint">${esc(t.hint)}</button><span class="muted" id="hintinfo"></span>` : ""}</div></fieldset>`;
        }
        default: return `<label class="${["date", "number", "month"].includes(f.type) ? "half" : ""}">${label}${f.req ? " *" : ""}<input type="${f.type}" ${f.type === "number" ? 'step="any"' : ""} data-k="${f.key}" value="${esc(v ?? "")}"></label>`;
      }
    };
    const prev = d.col === "invoices" ? this.previewPane() : "";
    return `<div class="backdrop"><form class="dialog${prev ? " wp" : ""}" id="form" style="--mc:${this.color(item.medium)}">
      <div class="dhead"><span class="grab"></span><h2>${esc(item.id ? t.edit : t.add)} · ${esc(t.tabs[d.col])}</h2><button type="button" class="x" id="dlgx" aria-label="${esc(t.cancel)}">✕</button></div>
      <div class="dsplit">${prev}<div class="dbody">${d.col === "invoices" ? this.attachBlock() : ""}<div class="grid">${this.spec(d.col).map(field).join("")}</div>
      ${d.error ? `<div class="msg err">${esc(d.error)}</div>` : ""}</div></div>
      <div class="actions">${item.id ? `<button type="button" class="danger" id="dlgdel">${esc(t.del)}</button>` : ""}<span class="sp"></span><button type="button" id="cancel">${esc(t.cancel)}</button><button type="submit" class="primary">${esc(t.save)}</button></div></form></div>`;
  }

  /* ---------- events ---------- */
  _bind() {
    const $ = (s) => this.shadowRoot.querySelector(s);
    this.shadowRoot.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", async () => {
      this._tab = b.dataset.tab; this._msg = ""; this._work = null;
      if (this._tab === "investments") { this._render(); await this._loadRoi(); }
      if (this._tab === "summary" || this._tab === "invoices") await this._loadSummary();
      this._render();
    }));
    const setYear = async (y) => { this._year = y; if (["summary", "invoices"].includes(this._tab)) await this._loadSummary(); this._render(); };
    $("#year")?.addEventListener("change", (e) => setYear(Number(e.target.value)));
    this.shadowRoot.querySelectorAll("[data-ystep]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); setYear(Number(this._year) + Number(b.dataset.ystep)); }));
    $("#medium")?.addEventListener("change", (e) => { this._medium = e.target.value; this._render(); });
    $("#add")?.addEventListener("click", () => this.openDialog(this._tab, {}));
    $("#fab")?.addEventListener("click", () => this.openDialog(this._tab, {}));
    this.shadowRoot.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => {
      const it = this._data[this._tab].find((r) => r.id === b.dataset.edit);
      this.openDialog(this._tab, JSON.parse(JSON.stringify(it)));
    }));
    this.shadowRoot.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", async () => {
      if (!confirm(this.t.confirm_del)) return;
      await this.ws({ type: "delete", collection: this._tab, item_id: b.dataset.del });
      await this._load();
    }));
    $("#savewiz")?.addEventListener("click", () => this._saveWizard());
    $("#recalc")?.addEventListener("click", async () => { await this._loadSummary(true); this._render(); });
    $("#savesettings")?.addEventListener("click", async () => {
      try { await this.ws({ type: "settings", settings: JSON.parse($("#settings").value) }); this._msg = this.t.saved; await this._load(); }
      catch (e) { this._msg = `${this.t.error}: ${e.message || e}`; this._render(); }
    });
    $("#export")?.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(this._data, null, 1)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = `utility_costs_${new Date().toISOString().slice(0, 10)}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
    $("#import")?.addEventListener("click", async () => {
      try {
        const counts = await this.ws({ type: "import", data: JSON.parse($("#importdata").value), mode: $("#importmode").value });
        this._msg = `${this.t.imported}: ${Object.entries(counts).map(([k, v]) => `${this.t.tabs[k] || k} ${v}`).join(", ")}`;
        await this._load();
      } catch (e) { this._msg = `${this.t.error}: ${e.message || e}`; this._render(); }
    });
    if (this._dialog) this._bindDialog();
    if (this._tab === "settings" || this._pd) this._bindEdit();
    if (this._tab === "investments") this._bindInvest();
    this._bindMore();
  }

  openDialog(col, item) {
    if (!item.medium && col !== "investments") item.medium = this._medium || this.media[0]?.id;
    if (col === "invoices" && !item.kind) item.kind = "settlement";
    if (col === "investments" && !item.project_id && this._proj) item.project_id = this._proj;
    this._dialog = { col, item };
    this._render();
  }

  _collect() {
    const d = this._dialog;
    const item = d.item;
    this.shadowRoot.querySelectorAll("[data-k]").forEach((el) => {
      const k = el.dataset.k;
      const f = this.spec(d.col).find((x) => x.key === k) || {};
      if (el.type === "checkbox") item[k] = el.checked;
      else if (f.type === "number") item[k] = el.value === "" ? null : Number(el.value);
      else item[k] = el.value || (f.type === "date" ? null : "");
    });
    const zoneVals = {};
    this.shadowRoot.querySelectorAll("[data-zone]").forEach((el) => {
      const key = el.dataset.zone;
      zoneVals[key] = zoneVals[key] || {};
      if (el.value !== "") zoneVals[key][el.dataset.z] = Number(el.value);
    });
    Object.assign(item, zoneVals);
    Object.keys(item).forEach((k) => { if (item[k] === null || item[k] === "") delete item[k]; });
    return item;
  }

  _bindDialog() {
    const $ = (s) => this.shadowRoot.querySelector(s);
    this._bindAttach();
    $("#cancel").addEventListener("click", () => { this._dialog = null; this._render(); });
    $("#dlgx")?.addEventListener("click", () => { this._dialog = null; this._render(); });
    $("#dlgdel")?.addEventListener("click", async () => {
      if (!confirm(this.t.confirm_del)) return;
      await this.ws({ type: "delete", collection: this._dialog.col, item_id: this._dialog.item.id });
      this._dialog = null; await this._load();
    });
    $(".backdrop")?.addEventListener("click", (e) => { if (e.target.classList.contains("backdrop")) { this._dialog = null; this._render(); } });
    $("[data-k=medium]")?.addEventListener("change", () => { this._collect(); this._render(); });
    $("#hint")?.addEventListener("click", async () => {
      const item = this._collect();
      const info = $("#hintinfo");
      if (!item.period_from || !item.period_to) return;
      try {
        const r = await this.ws({ type: "ha_quantity", medium: item.medium, period_from: item.period_from, period_to: item.period_to });
        if (!r.coverage) { info.textContent = this.t.hint_none; return; }
        Object.entries(r.qty).forEach(([z, v]) => {
          const el = this.shadowRoot.querySelector(`[data-zone=quantities][data-z="${z}"]`);
          if (el) el.value = Math.round(v * 100) / 100;
        });
        info.textContent = this.t.coverage.replace("{p}", Math.round(r.coverage * 100));
      } catch (e) { info.textContent = `${this.t.error}: ${e.message || e}`; }
    });
    $("#form").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const item = this._collect();
      const missing = this.spec(this._dialog.col).filter((f) => f.req && (item[f.key] === undefined));
      if (missing.length) { this._dialog.error = missing.map((f) => this.t.f[f.key]).join(", ") + " *"; this._render(); return; }
      try {
        const removed = this._dialog.removed || [];
        await this.ws({ type: "save", collection: this._dialog.col, item });
        removed.forEach((id) => this.ws({ type: "file_delete", file_id: id }).catch(() => {}));
        this._dialog = null; this._msg = this.t.saved;
        await this._load();
        if (this._tab === "invoices") { await this._loadSummary(); this._render(); }
      } catch (e) { this._dialog.error = `${this.t.error}: ${e.message || e}`; this._render(); }
    });
  }
}
for (const Ext of [makeExt({ esc, getP, setP, uid }), makeMore({ esc })])
  for (const [k, d] of Object.entries(Object.getOwnPropertyDescriptors(Ext.prototype))) if (k !== "constructor") Object.defineProperty(UtilityCostsPanel.prototype, k, d);

if (!customElements.get("utility-costs-panel")) customElements.define("utility-costs-panel", UtilityCostsPanel);
