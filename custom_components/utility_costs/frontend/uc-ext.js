/* Utility Costs – settings wizard, investments / ROI */
export const ALL_P = "__all";
const PART_COLORS = ["#4FB477", "#3A9BE0", "#E0A53A", "#8E6CC2", "#D2557A", "#2BB5A8"];
export const makeExt = ({ esc, getP, setP, uid }) => class {
  /* ---------- shared editors ---------- */
  datalists() {
    const st = this._hass?.states || {};
    const stats = Object.values(st).filter((s) => ["total", "total_increasing"].includes(s.attributes?.state_class))
      .map((s) => `<option value="${esc(s.entity_id)}">${esc(s.attributes.friendly_name || "")}${s.attributes.unit_of_measurement ? " · " + esc(s.attributes.unit_of_measurement) : ""}</option>`).join("");
    const nums = Object.keys(st).filter((e) => e.startsWith("input_number.")).map((e) => `<option value="${esc(e)}">${esc(st[e].attributes.friendly_name || "")}</option>`).join("");
    return `<datalist id="ucstats">${stats}</datalist><datalist id="ucnum">${nums}</datalist>`;
  }

  entName(id) { const s = this._hass?.states?.[id]; return s?.attributes?.friendly_name || id; }

  srcEditor(base, list, unit) {
    const t = this.t;
    const rows = (list || []).map((s, i) => `<div class="src">
      <div class="grid"><label class="half">${esc(t.src_from)}<input type="date" data-p="${base}.${i}.from" value="${esc(s.from || "")}"></label>
      <label class="half">${esc(t.src_factor)}<input type="number" step="any" data-num data-p="${base}.${i}.factor" value="${s.factor ?? ""}" placeholder="1"></label></div>
      <div class="lbl">${esc(t.src_ids)}</div>
      <div class="ids">${(s.ids || []).map((id, j) => `<span class="ent" title="${esc(id)}">${esc(this.entName(id))}<small>${esc(id)}</small><button type="button" class="xs" data-act="rm" data-p="${base}.${i}.ids" data-i="${j}">✕</button></span>`).join("")}
        <input list="ucstats" class="addent" data-addto="${base}.${i}.ids" placeholder="${esc(t.add_entity)}"></div>
      <button type="button" class="link danger" data-act="rm" data-p="${base}" data-i="${i}">${esc(t.del_src)}</button></div>`).join("");
    return `${rows}<button type="button" class="small" data-act="add" data-p="${base}" data-tpl="src">${esc(t.add_src)}</button>`;
  }

  /* ---------- settings wizard ---------- */
  _workSettings() {
    if (!this._work) {
      const w = JSON.parse(JSON.stringify(this.settings));
      w.sync = w.sync || {};
      (w.media || []).forEach((m) => {
        m.zones = m.zones && m.zones.length ? m.zones : [{ id: "all", name: "" }];
        m.statistics = m.statistics || {};
        Object.keys(m.statistics).forEach((z) => { if (!Array.isArray(m.statistics[z])) m.statistics[z] = [m.statistics[z]]; });
      });
      this._work = w;
    }
    return this._work;
  }

  renderSettings() {
    const t = this.t;
    if (!this.admin) return `<p class="muted">${esc(t.readonly)}</p>`;
    const w = this._workSettings();
    const media = (w.media || []).map((m, i) => {
      const zones = m.zones.map((z, j) => `<div class="zone">
        <div class="zhead"><label>${esc(t.zone_name)}<input data-p="media.${i}.zones.${j}.name" value="${esc(z.name || "")}" placeholder="${esc(t.zones[z.id] || z.id)}"></label>
        ${m.zones.length > 1 ? `<button type="button" class="link danger" data-act="rmzone" data-i="${i}" data-j="${j}">${esc(t.del_zone)}</button>` : ""}</div>
        <div class="lbl">${esc(t.meters)}</div>
        ${this.srcEditor(`media.${i}.statistics.${z.id}`, m.statistics[z.id], m.unit)}
        <label class="mt">${esc(t.sync_price)}<input list="ucnum" data-sync="${esc(m.id)}.${esc(z.id)}" value="${esc(w.sync[`${m.id}.${z.id}`] || "")}" placeholder="input_number.…"></label></div>`).join("");
      return `<section class="card set" style="--mc:${this.color(m.id)}">
        <div class="shead"><b>${esc(m.name || t.media[m.id] || m.id)}</b><button type="button" class="link danger" data-act="rmmedium" data-i="${i}">${esc(t.del_medium)}</button></div>
        <div class="grid"><label>${esc(t.m_name)}<input data-p="media.${i}.name" value="${esc(m.name || "")}" placeholder="${esc(t.media[m.id] || "")}"></label>
        <label class="half">${esc(t.m_unit)}<input data-p="media.${i}.unit" value="${esc(m.unit || "")}"></label><label class="half">${esc(t.m_id)}<input value="${esc(m.id)}" disabled></label></div>
        <h4>${esc(t.zones_h)}</h4>${zones}
        <button type="button" class="small" data-act="addzone" data-i="${i}">${esc(t.add_zone)}</button>
        <label class="mt">${esc(t.sync_fixed)}<input list="ucnum" data-sync="${esc(m.id)}.fixed" value="${esc(w.sync[`${m.id}.fixed`] || "")}" placeholder="input_number.…"></label>
      </section>`;
    }).join("");
    return `<div class="edit wiz" data-w="s">${this.datalists()}
      <p class="muted hint">${esc(t.hint_src)}</p>
      <section class="card set"><div class="shead"><b>${esc(t.s_general)}</b></div><div class="grid"><label class="half">${esc(t.currency)}<input data-p="currency" value="${esc(w.currency || "")}" maxlength="3"></label>
        <label>${esc(t.ai_entity)}<select data-p="ai_entity"><option value="">${esc(t.ai_none)}</option>${Object.keys(this._hass?.states || {}).filter((e) => e.startsWith("ai_task.")).map((e) => `<option value="${esc(e)}" ${e === (w.ai_entity ?? Object.keys(this._hass.states).find((x) => x.startsWith("ai_task."))) ? "selected" : ""}>${esc(this.entName(e))}</option>`).join("")}</select></label></div></section>
      ${this.notifySection(w)}
      ${media}
      <button type="button" data-act="addmedium">${esc(t.add_medium)}</button>
      <div class="savebar"><button type="button" class="primary" id="savewiz">${esc(t.save_settings)}</button></div>
      <details class="adv"><summary>${esc(t.advanced)}</summary>
        <textarea id="settings" rows="14">${esc(JSON.stringify(this.settings, null, 2))}</textarea>
        <button class="primary" id="savesettings">${esc(t.save)}</button></details>
      <h3>${esc(t.import)} / ${esc(t.export)}</h3>
      <button id="export">${esc(t.export)}</button>
      <label class="block">${esc(t.import_json)}<textarea id="importdata" rows="4"></textarea></label>
      <div class="row"><select id="importmode"><option value="merge">${esc(t.mode_merge)}</option><option value="replace">${esc(t.mode_replace)}</option></select>
      <button class="primary" id="import">${esc(t.import)}</button></div></div>`;
  }

  _cleanSources(list) {
    return (list || []).map((s) => {
      const o = { from: s.from || null, ids: (s.ids || []).filter(Boolean) };
      if (s.factor !== undefined && s.factor !== null && s.factor !== "" && Number(s.factor) !== 1) o.factor = Number(s.factor);
      return o;
    }).filter((s) => s.ids.length);
  }

  async _saveWizard() {
    const w = JSON.parse(JSON.stringify(this._work));
    w.currency = String(w.currency || "").toUpperCase().slice(0, 3);
    w.media.forEach((m) => {
      const zs = m.zones.map((z) => z.id);
      const st = {};
      zs.forEach((z) => { const c = this._cleanSources(m.statistics[z]); if (c.length) st[z] = c; });
      m.statistics = st;
    });
    Object.keys(w.sync).forEach((k) => { if (!w.sync[k]) delete w.sync[k]; });
    try { await this.ws({ type: "settings", settings: w }); this._work = null; this._msg = this.t.saved; await this._load(); }
    catch (e) { this._msg = `${this.t.error}: ${e.message || e}`; this._render(); }
  }

  /* ---------- invoice attachments + AI ---------- */
  attachBlock() {
    const t = this.t, d = this._dialog, atts = d.item.attachments || [];
    const kb = (n) => (n > 1048576 ? `${this.num(n / 1048576, 1)} MB` : `${Math.max(1, Math.round(n / 1024))} kB`);
    return `<div class="attbox">
      ${!atts.length && !d.item.id ? `<div class="muted small">${esc(t.ai_hint_new)}</div>` : ""}
      ${atts.map((a) => `<div class="attrow"><span>${a.type === "application/pdf" ? "📄" : "🖼️"}</span><a href="#" data-open="${esc(a.id)}">${esc(a.name)}</a><small class="muted">${kb(a.size || 0)}</small><button type="button" class="xs" data-rmatt="${esc(a.id)}">✕</button></div>`).join("")}
      <div class="attact"><label class="filebtn ${d.busy ? "dis" : ""}"><input type="file" id="attfile" accept="application/pdf,image/*" hidden ${d.busy ? "disabled" : ""}>📎 ${esc(d.busy === "up" ? t.uploading : t.add_file)}</label>
      ${atts.length ? `<button type="button" id="airead" class="primary small" ${d.busy ? "disabled" : ""}>✨ ${esc(d.busy === "ai" ? t.ai_reading : t.ai_read)}</button>` : ""}</div>
      ${d.aiMsg ? `<div class="${d.aiErr ? "msg err" : "aimsg"}">${esc(d.aiMsg)}</div>` : ""}</div>`;
  }

  _prevAtt() {
    const d = this._dialog, atts = (d && d.item.attachments) || [];
    if (!atts.length) return null;
    if (!atts.some((a) => a.id === d.prevId)) d.prevId = atts[0].id;
    return atts.find((a) => a.id === d.prevId);
  }

  _prevBody(a) {
    const d = this._dialog, t = this.t, url = (d.blobs || {})[a.id];
    if (!url) return `<div class="muted small pmsg">${esc(d.prevErr === a.id ? t.prev_err : t.prev_load)}</div>`;
    return (a.type || "").startsWith("image/")
      ? `<img src="${url}" alt="${esc(a.name)}">`
      : `<iframe src="${url}#view=FitH" title="${esc(a.name)}"></iframe>`;
  }

  previewPane() {
    const t = this.t, d = this._dialog, a = this._prevAtt();
    if (!a) return "";
    const atts = d.item.attachments;
    const names = atts.length > 1
      ? atts.map((x) => `<button type="button" class="ptab ${x.id === a.id ? "on" : ""}" data-prev="${esc(x.id)}">${esc(x.name)}</button>`).join("")
      : `<span class="pname">${esc(a.name)}</span>`;
    return `<div class="prev ${d.prevHide ? "hid" : ""}"><div class="prevbar">${names}<span class="sp"></span>
      <button type="button" class="ptab" data-open="${esc(a.id)}" title="${esc(t.prev_open)}">↗</button>
      <button type="button" class="ptab mobonly" id="prevtog">${esc(d.prevHide ? t.prev_show : t.prev_hide)}</button></div>
      <div class="prevbody">${this._prevBody(a)}</div></div>`;
  }

  async _loadPrev() {
    const d = this._dialog, a = this._prevAtt();
    if (!a || (d.blobs || {})[a.id] || d.prevLoading === a.id || d.prevErr === a.id) return;
    d.prevLoading = a.id;
    try {
      const res = await this._hass.fetchWithAuth(`/api/utility_costs/file/${encodeURIComponent(a.id)}`);
      if (!res.ok) throw new Error(res.status);
      const blob = new Blob([await res.arrayBuffer()], { type: a.type || res.headers.get("Content-Type") || "application/pdf" });
      (d.blobs = d.blobs || {})[a.id] = URL.createObjectURL(blob);
    } catch (e) { d.prevErr = a.id; }
    d.prevLoading = null;
    if (this._dialog !== d) { Object.values(d.blobs || {}).forEach((u) => URL.revokeObjectURL(u)); return; }
    const cur = this._prevAtt(), box = this.shadowRoot.querySelector(".prevbody");
    if (box && cur) box.innerHTML = this._prevBody(cur);
    if (cur && cur.id !== a.id) this._loadPrev();
  }

  async _aiRead() {
    const d = this._dialog, t = this.t;
    const att = (d.item.attachments || []).slice(-1)[0];
    if (!att) return;
    this._collect();
    d.busy = "ai"; d.aiMsg = ""; d.aiErr = false; this._rerenderKeep();
    try {
      const r = await this.ws({ type: "extract", file_id: att.id, medium: d.item.medium || null });
      delete r._source;
      const keys = Object.keys(r);
      Object.assign(d.item, r);
      d.aiFields = keys; d.aiMsg = t.ai_done;
    } catch (e) { d.aiErr = true; d.aiMsg = `${t.ai_err}: ${e.message || e}`; }
    d.busy = false;
    if (this._dialog === d) this._rerenderKeep();
  }

  _bindAttach() {
    const d = this._dialog;
    if (!d || d.col !== "invoices") return;
    const root = this.shadowRoot;
    (d.aiFields || []).forEach((k) => {
      root.querySelectorAll(k === "quantities" ? "[data-zone=quantities]" : `[data-k="${k}"]`).forEach((el) => el.classList.add("aifill"));
    });
    root.querySelector("#attfile")?.addEventListener("change", async (ev) => {
      const f = ev.target.files && ev.target.files[0];
      if (!f) return;
      this._collect();
      d.busy = "up"; d.aiMsg = ""; this._rerenderKeep();
      try {
        const fd = new FormData(); fd.append("file", f, f.name);
        const res = await this._hass.fetchWithAuth("/api/utility_costs/upload", { method: "POST", body: fd });
        const j = await res.json();
        if (!res.ok) throw new Error(j.message || res.status);
        d.item.attachments = [...(d.item.attachments || []), j];
        d.prevId = j.id;
        (d.uploaded = d.uploaded || []).push(j.id);
        d.busy = false;
        if (this._settingsAi() ) { await this._aiRead(); return; }
      } catch (e) { d.busy = false; d.aiErr = true; d.aiMsg = `${this.t.error}: ${e.message || e}`; }
      this._rerenderKeep();
    });
    root.querySelector("#airead")?.addEventListener("click", () => this._aiRead());
    root.querySelectorAll("[data-open]").forEach((a) => a.addEventListener("click", async (ev) => {
      ev.preventDefault();
      try { const r = await this.ws({ type: "file_url", file_id: a.dataset.open }); window.open(r.url, "_blank"); }
      catch (e) { d.aiErr = true; d.aiMsg = `${this.t.error}: ${e.message || e}`; this._rerenderKeep(); }
    }));
    root.querySelectorAll("[data-prev]").forEach((b) => b.addEventListener("click", () => {
      this._collect(); d.prevId = b.dataset.prev; this._rerenderKeep();
    }));
    root.querySelector("#prevtog")?.addEventListener("click", () => {
      d.prevHide = !d.prevHide;
      root.querySelector(".prev")?.classList.toggle("hid", d.prevHide);
      const b = root.querySelector("#prevtog"); if (b) b.textContent = d.prevHide ? this.t.prev_show : this.t.prev_hide;
    });
    this._loadPrev();
    root.querySelectorAll("[data-rmatt]").forEach((b) => b.addEventListener("click", () => {
      this._collect();
      const id = b.dataset.rmatt;
      d.item.attachments = (d.item.attachments || []).filter((a) => a.id !== id);
      if ((d.uploaded || []).includes(id)) this.ws({ type: "file_delete", file_id: id }).catch(() => {});
      else (d.removed = d.removed || []).push(id);
      this._rerenderKeep();
    }));
    const discard = () => { (d.uploaded || []).forEach((id) => this.ws({ type: "file_delete", file_id: id }).catch(() => {})); };
    root.querySelector("#cancel")?.addEventListener("click", discard);
    root.querySelector("#dlgx")?.addEventListener("click", discard);
    root.querySelector(".backdrop")?.addEventListener("click", (e) => { if (e.target.classList.contains("backdrop")) discard(); });
  }

  _settingsAi() {
    const s = this.settings;
    const auto = s.ai_entity === undefined;
    return Boolean(s.ai_entity || (auto && Object.keys(this._hass?.states || {}).some((e) => e.startsWith("ai_task."))));
  }

  /* ---------- investments / ROI ---------- */
  get projects() { return this._data?.projects || []; }

  projInvestments(pid) {
    if (pid === ALL_P) return this._data.investments || [];
    const first = this.projects[0]?.id;
    return (this._data.investments || []).filter((i) => i.project_id === pid || (!i.project_id && pid === first));
  }

  _projValid() {
    const P = this.projects;
    if (P.length > 1 && (this._proj === undefined || this._proj === null || this._proj === ALL_P)) { this._proj = ALL_P; return; }
    if (!P.find((p) => p.id === this._proj)) this._proj = P.length > 1 ? ALL_P : P[0]?.id;
  }

  /* pseudo project used for the "All" chip: every rule of every project */
  _curProj() {
    if (this._proj !== ALL_P) return this.projects.find((x) => x.id === this._proj);
    return { id: ALL_P, name: this.t.all, rules: this.projects.flatMap((p) => (p.rules || []).map((ru) => ({ ...ru, label: `${p.name} · ${ru.label || this.t.types[ru.type || "qty"]}`, _pid: p.id }))) };
  }

  async _loadRoi(force = false) {
    this._projValid();
    if (!this._proj) return;
    this._roi = this._roi || {};
    try {
      if (this._proj === ALL_P) {
        const list = await Promise.all(this.projects.map(async (p) => {
          if (force || !this._roi[p.id]) this._roi[p.id] = await this.ws({ type: "roi", project_id: p.id, force });
          return [p, this._roi[p.id]];
        }));
        this._roi[ALL_P] = this._aggRoi(list);
      } else this._roi[this._proj] = await this.ws({ type: "roi", project_id: this._proj, force });
      this._roiErr = "";
    } catch (e) { this._roiErr = `${this.t.error}: ${e.message || e}`; }
  }

  /* sum the results of several projects into one ROI result */
  _aggRoi(list) {
    list = list.filter(([, r]) => r && r.years);
    const sum = (f) => list.reduce((a, [, r]) => a + Number(r[f] || 0), 0);
    const ys = {}, ms = {};
    list.forEach(([p, r], pi) => {
      r.years.forEach((y) => {
        const a = ys[y.year] = ys[y.year] || { year: y.year, saved: 0, invested: 0, estimated: 0, n: 0, proj: 0, partial: false, by: {} };
        a.saved += y.saved || 0; a.invested += y.invested || 0; a.estimated += y.estimated || 0; a.n++;
        if (y.projected) a.proj++; if (y.partial) a.partial = true;
        a.by[p.id] = { saved: y.saved || 0, invested: y.invested || 0, cum_saved: y.cum_saved || 0, projected: !!y.projected };
      });
      (r.months || []).forEach((m) => {
        const a = ms[m.month] = ms[m.month] || { month: m.month, saved: 0, estimated: 0, rules: {} };
        a.saved += m.saved || 0;
        a.estimated = typeof m.estimated === "number" ? (Number(a.estimated) || 0) + m.estimated : a.estimated || m.estimated;
        Object.assign(a.rules, m.rules || {});
      });
    });
    let cs = 0, ci = 0;
    const years = Object.values(ys).sort((a, b) => a.year - b.year).map((a) => {
      cs += a.saved; ci += a.invested;
      return { year: a.year, saved: a.saved, invested: a.invested, estimated: a.estimated, projected: a.proj === a.n, partial: a.partial, cum_saved: cs, cum_invested: ci, by: a.by };
    });
    const months = Object.values(ms).sort((a, b) => a.month.localeCompare(b.month));
    // carry the cumulative per project over years in which a project has no row
    const last = {};
    years.forEach((y) => list.forEach(([p]) => { if (y.by[p.id]) last[p.id] = y.by[p.id].cum_saved; else y.by[p.id] = { saved: 0, invested: 0, cum_saved: last[p.id] || 0, projected: true }; }));
    // payback: first month in which cumulative savings reach the cumulative investment
    let payback = null;
    for (let i = 0; i < years.length && !payback; i++) {
      const y = years[i];
      if (!(y.cum_invested > 0) || y.cum_saved < y.cum_invested) continue;
      const prev = i ? years[i - 1].cum_saved : 0;
      const ym = months.filter((m) => m.month.startsWith(`${y.year}-`));
      let mon = null;
      if (ym.length && !y.projected) { let c = prev; for (const m of ym) { c += m.saved || 0; if (c >= y.cum_invested) { mon = m.month; break; } } }
      if (!mon) { const f = y.saved > 0 ? (y.cum_invested - prev) / y.saved : 1; mon = `${y.year}-${String(Math.min(12, Math.max(1, Math.ceil(f * 12)))).padStart(2, "0")}`; }
      payback = { month: mon, projected: y.projected || (y.partial && mon > new Date().toISOString().slice(0, 7)) };
    }
    const starts = list.map(([, r]) => r.start).filter(Boolean).sort();
    const start = starts[0] || null;
    let payback_years = null;
    if (payback && start) payback_years = (Date.parse(`${payback.month}-01`) - Date.parse(start)) / (365.25 * 864e5);
    const invested = sum("invested"), saved = sum("saved");
    const metas = list.map(([, r]) => r._meta?.computed_at).filter(Boolean).sort();
    return {
      start, invested, saved, estimated: sum("estimated"), net: saved - invested, progress_pct: invested ? (saved / invested) * 100 : 0,
      avg_year: sum("avg_year"), lifetime_saved: sum("lifetime_saved"), price_estimated: list.some(([, r]) => r.price_estimated),
      payback, payback_years, years, months, rules: list.flatMap(([, r]) => r.rules || []),
      parts: list.map(([p], i) => ({ id: p.id, name: p.name, color: PART_COLORS[i % PART_COLORS.length] })),
      _meta: metas.length ? { computed_at: metas[0] } : undefined,
    };
  }

  monthName(mk) { return new Date(mk + "-01T00:00:00").toLocaleDateString(this.locale, { month: "long", year: "numeric" }); }

  chart(r) {
    const t = this.t;
    const now = new Date().getFullYear();
    const pb = r.payback ? Number(r.payback.month.slice(0, 4)) : null;
    const last = Math.max(now + 3, pb ? pb + 2 : now + 10);
    const ys = r.years.filter((y) => y.year <= last);
    if (!ys.length) return "";
    const n = ys.length, W = 600, H = 200, pb2 = 22, pt = 12, bw = W / n;
    const maxV = Math.max(r.invested, ...ys.map((y) => Math.max(y.cum_saved, y.cum_invested)), 1);
    const Y = (v) => pt + (H - pt - pb2) * (1 - Math.max(0, v) / maxV);
    const step = Math.ceil(n / 8);
    const bars = ys.map((y, i) => {
      const x = i * bw + bw * 0.15, w = bw * 0.7, top = Y(y.cum_saved);
      if (r.parts) {
        let base = H - pb2, segs = "";
        r.parts.forEach((pp) => {
          const v = Math.max(0, y.by?.[pp.id]?.cum_saved || 0); if (!v) return;
          const h = (H - pt - pb2) * v / maxV;
          segs += `<rect x="${x.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" class="${y.projected ? "proj" : ""} ybar" style="fill:${pp.color}"></rect>`;
          base -= h;
        });
        return `${segs}${i % step === 0 || i === n - 1 ? `<text x="${(i * bw + bw / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle">${String(y.year).slice(2)}'</text>` : ""}`;
      }
      const ok = y.cum_saved >= y.cum_invested && y.cum_invested > 0;
      return `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${(H - pb2 - top).toFixed(1)}" rx="2" class="${ok ? "bok" : "bsv"} ${y.projected ? "proj" : ""} ybar" data-ybar="${y.year}"></rect>
        ${i % step === 0 || i === n - 1 ? `<text x="${(i * bw + bw / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle">${String(y.year).slice(2)}'</text>` : ""}`;
    }).join("");
    let path = "";
    ys.forEach((y, i) => { const yy = Y(y.cum_invested).toFixed(1); path += `${i ? "L" : "M"}${(i * bw).toFixed(1)},${yy} L${((i + 1) * bw).toFixed(1)},${yy} `; });
    const nowIdx = ys.findIndex((y) => y.year === now);
    const sel = this._roiSel(r);
    const hits = ys.map((y, i) => `<rect x="${(i * bw).toFixed(1)}" y="0" width="${bw.toFixed(1)}" height="${H}" class="yhit${y.year === sel ? " on" : ""}" data-yr="${y.year}" tabindex="0" role="button" aria-label="${y.year}"><title>${y.year}: ${esc(t.yd_saved)} ${this.money(y.saved)} · ${esc(t.yd_net)} ${this.money(y.cum_saved - y.cum_invested)}</title></rect>`).join("");
    return `<div class="chart card"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img">
      ${nowIdx >= 0 ? `<rect x="${(nowIdx * bw).toFixed(1)}" y="0" width="${bw.toFixed(1)}" height="${H - pb2}" class="nowcol"/>` : ""}
      ${bars}<path d="${path}" class="inv"/>${hits}</svg>
      <div class="legend">${r.parts ? r.parts.map((pp) => `<span><i class="lg" style="background:${pp.color}"></i>${esc(pp.name)}</span>`).join("") : `<span><i class="lg bsv"></i>${esc(t.chart_cum)}</span>`}<span><i class="lg proj bsv"></i>${esc(t.projected)}</span><span><i class="lg line"></i>${esc(t.chart_inv)}</span></div>
      <div class="ydet">${this.yearDetail(r, sel)}</div></div>`;
  }

  _roiSel(r) {
    const years = (r.years || []).map((y) => y.year);
    if (!years.includes(this._roiYear)) {
      const now = new Date().getFullYear();
      this._roiYear = years.includes(now) ? now : years[years.length - 1];
    }
    return this._roiYear;
  }

  yearDetail(r, year) {
    const t = this.t;
    const y = (r.years || []).find((x) => x.year === year);
    if (!y) return `<p class="muted small">${esc(t.yd_hint)}</p>`;
    const yrs = r.years.map((x) => x.year), i = yrs.indexOf(year);
    const p = this._curProj() || {};
    const net = y.cum_saved - y.cum_invested;
    const byProj = r.parts ? `<div class="ysub">${esc(t.yd_projects)}</div>${r.parts.map((pp) => { const b = y.by?.[pp.id] || {}; if (!b.saved && !b.invested) return ""; return `<div class="rrow"><span class="rlbl"><span><span class="dot" style="background:${pp.color}"></span>${esc(pp.name)}</span>${b.invested ? `<small class="neg">−${this.money(b.invested)}</small>` : ""}</span><b class="${b.saved < 0 ? "neg" : ""}">${this.money(b.saved)}</b></div>`; }).join("")}` : "";
    const months = (r.months || []).filter((m) => m.month.startsWith(`${year}-`));
    const mx = Math.max(...months.map((m) => Math.abs(m.saved || 0)), 1);
    const mbars = months.length ? `<div class="ymon">${months.map((m) => {
      const h = Math.round(Math.abs(m.saved || 0) / mx * 100);
      const lbl = new Date(m.month + "-01T00:00:00").toLocaleDateString(this.locale, { month: "short" });
      const parts = Object.entries(m.rules || {}).map(([id, v]) => { const ru = (p.rules || []).find((q) => q.id === id) || {}; return `${ru.label || id}: ${this.money(v.saved)}`; }).join("\n");
      return `<div class="ym${m.estimated ? " est" : ""}" title="${esc(this.monthName(m.month))}: ${this.money(m.saved)}${parts ? "\n" + esc(parts) : ""}"><span class="yv">${this.num(m.saved, 0)}</span><i class="${(m.saved || 0) < 0 ? "neg" : ""}" style="height:${Math.max(1, Math.round(h * 0.64))}px"></i><span class="yl">${esc(lbl)}</span></div>`;
    }).join("")}</div>` : "";
    const per = {};
    months.forEach((m) => Object.entries(m.rules || {}).forEach(([id, v]) => { const a = per[id] = per[id] || { qty: 0, saved: 0 }; a.qty += v.qty || 0; a.saved += v.saved || 0; }));
    const rules = Object.keys(per).length ? `<div class="ysub">${esc(t.yd_rules)}</div>${(p.rules || []).filter((ru) => per[ru.id]).map((ru) => {
      const unit = ru.type === "qty" || !ru.type ? esc(this.unit(ru.medium)) : "";
      return `<div class="rrow"><span class="rlbl"><span><span class="dot" style="background:${ru.type === "money" ? "var(--primary-color)" : this.color(ru.medium)}"></span>${esc(ru.label || t.types[ru.type || "qty"])}</span>${unit ? `<small>${this.num(per[ru.id].qty, 0)} ${unit}</small>` : ""}</span><b class="${per[ru.id].saved < 0 ? "neg" : ""}">${this.money(per[ru.id].saved)}</b></div>`;
    }).join("")}` : "";
    const ex = this.projInvestments(this._proj).filter((e) => String(e.date || "").startsWith(`${year}-`)).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    const exl = ex.length ? `<div class="ysub">${esc(t.yd_exp)} (${ex.length})</div>${ex.slice(0, 6).map((e) => `<div class="rrow"><span class="rlbl"><span>${esc(e.description || t.cats[e.category] || "")}</span><small>${this.date(e.date)}</small></span><b class="${e.amount < 0 ? "pos" : ""}">${this.money(e.amount)}</b></div>`).join("")}${ex.length > 6 ? `<p class="muted small">${esc(t.yd_more.replace("{n}", ex.length - 6))}</p>` : ""}` : "";
    return `<div class="yhead"><button type="button" class="yarr" data-ystep2="-1" ${i <= 0 ? "disabled" : ""}>‹</button><b>${year}</b>${y.projected ? `<small class="muted">${esc(t.projected)}</small>` : y.partial ? `<small class="muted">${esc(t.yd_partial)}</small>` : "<small></small>"}<button type="button" class="yarr" data-ystep2="1" ${i >= yrs.length - 1 ? "disabled" : ""}>›</button></div>
      <div class="ystats">
        <div><span>${esc(t.yd_saved)}</span><b class="${y.saved < 0 ? "neg" : ""}">${this.money(y.saved)}</b></div>
        <div><span>${esc(t.yd_inv)}</span><b class="${y.invested > 0 ? "neg" : y.invested < 0 ? "pos" : ""}">${this.money(y.invested)}</b></div>
        <div><span>${esc(t.yd_cum)}</span><b>${this.money(y.cum_saved)}</b><small>/ ${this.money(y.cum_invested)}</small></div>
        <div><span>${esc(t.yd_net)}</span><b class="${net >= 0 ? "pos" : "neg"}">${this.money(net)}</b></div>
      </div>
      ${y.projected ? `<p class="muted small">ⓘ ${esc(t.yd_proj)}</p>` : ""}${mbars}${byProj}${rules}${exl}`;
  }

  _selectRoiYear(year) {
    const r = this._roi?.[this._proj];
    if (!r) return;
    this._roiYear = year;
    const root = this.shadowRoot;
    root.querySelectorAll(".yhit").forEach((el) => el.classList.toggle("on", Number(el.dataset.yr) === year));
    root.querySelectorAll("tr[data-yrow]").forEach((el) => el.classList.toggle("on", Number(el.dataset.yrow) === year));
    const box = root.querySelector(".ydet");
    if (box) { box.innerHTML = this.yearDetail(r, year); this._bindYearDetail(); }
  }

  _bindYearDetail() {
    this.shadowRoot.querySelectorAll("[data-ystep2]").forEach((b) => b.addEventListener("click", () => {
      const r = this._roi?.[this._proj]; if (!r) return;
      const yrs = r.years.map((x) => x.year), i = yrs.indexOf(this._roiYear) + Number(b.dataset.ystep2);
      if (i >= 0 && i < yrs.length) this._selectRoiYear(yrs[i]);
    }));
  }

  renderInvest() {
    const t = this.t, cur = esc(this.settings.currency || "");
    const P = this.projects;
    this._projValid();
    const p = this._curProj(), all = this._proj === ALL_P;
    const chips = `<div class="pchips">${P.length > 1 ? `<button class="pchip ${all ? "on" : ""}" data-proj="${ALL_P}">${esc(t.all)}</button>` : ""}${P.map((x) => `<button class="pchip ${x.id === this._proj ? "on" : ""}" data-proj="${esc(x.id)}">${esc(x.name)}</button>`).join("")}
      ${this.admin ? `<button class="pchip add" id="newproj">+ ${esc(t.new_proj)}</button>` : ""}${p && !all && this.admin ? `<button class="pchip" id="editproj">✎ ${esc(t.edit_proj)}</button>` : ""}</div>`;
    let body = "";
    if (!p) body = `<div class="card empty">${esc(this._data.projects === undefined ? t.need_restart : t.no_proj)}</div>`;
    else {
      const r = this._roi?.[p.id];
      if (this._roiErr) body = `<div class="msg err">${esc(this._roiErr)}</div>`;
      else if (!r) body = `<p class="muted">${esc(t.loading)}</p>`;
      else {
        const prog = Math.max(0, Math.min(100, r.progress_pct || 0));
        const pbTxt = r.payback ? `${esc(this.monthName(r.payback.month))}${r.payback.projected ? ` <small>(${esc(t.projected)})</small>` : ""}` : esc(t.payback_none);
        const rules = (p.rules || []).map((ru) => {
          const tot = (r.rules || []).find((x) => x.id === ru.id) || {};
          const unit = ru.type === "qty" || !ru.type ? esc(this.unit(ru.medium)) : "";
          return `<div class="rrow"><span class="rlbl"><span><span class="dot" style="background:${ru.type === "money" ? "var(--primary-color)" : this.color(ru.medium)}"></span>${esc(ru.label || t.types[ru.type || "qty"])}</span>
            ${unit ? `<small>${this.num(tot.qty, 0)} ${unit}${tot.est_qty ? ` · ${esc(t.incl_est.replace("{v}", this.num(tot.est_qty, 0)))}` : ""}</small>` : ""}</span>
            <b class="${tot.saved < 0 ? "neg" : ""}">${this.money(tot.saved)}</b></div>`;
        }).join("");
        const nowY = new Date().getFullYear();
        const yrs = r.years.filter((y) => !y.projected || y.year <= Math.max(nowY + 2, r.payback ? Number(r.payback.month.slice(0, 4)) : 0)).map((y) =>
          `<tr class="${y.projected ? "projrow" : ""} yrow${y.year === this._roiYear ? " on" : ""}" data-yrow="${y.year}"><td>${y.year}${y.partial ? " …" : ""}${y.projected ? `<small class="muted">${esc(t.projected)}</small>` : ""}${y.invested ? `<small class="neg">−${this.money(y.invested)}</small>` : ""}</td>
           <td class="r">${this.money(y.saved)}</td>
           <td class="r ${y.cum_saved >= y.cum_invested ? "pos" : "neg"}">${this.money(y.cum_saved - y.cum_invested)}</td></tr>`).join("");
        body = `${this.roiMeta(r)}<div class="kpis">
          <div class="kpi"><span>${esc(t.invested)}</span><b>${this.money(r.invested)}</b><small>${cur}</small></div>
          <div class="kpi" style="border-top-color:var(--success-color,#4FB477)"><span>${esc(t.saved_to_date)}</span><b>${this.money(r.saved)}</b><small>${r.estimated ? esc(t.incl_est.replace("{v}", this.money(r.estimated))) : cur}</small></div>
          <div class="kpi"><span>${esc(t.payback)}</span><b class="sm">${pbTxt}</b><small>${r.payback_years ? esc(t.years_n.replace("{n}", this.num(r.payback_years, 1))) : ""}</small></div>
          <div class="kpi"><span>${esc(t.avg_year)}</span><b>${this.money(r.avg_year)}</b><small>${esc(t.lifetime)}: ${this.money(r.lifetime_saved - r.invested)}</small></div></div>
          <div class="prog card"><div class="ptop"><span>${esc(t.progress)}</span><b>${this.num(r.progress_pct, 0)}%</b></div><div class="pbar"><span style="width:${prog}%"></span></div></div>
          ${this.chart(r)}
          ${rules ? `<h3>${esc(t.rules_h)}</h3><div class="card rules">${rules}</div>` : ""}
          ${(() => { const miss = [...new Set((p.rules || []).filter((ru) => ru.type !== "money" && ru.medium && !(this._data.tariffs || []).some((tt) => tt.medium === ru.medium)).map((ru) => this.mName(ru.medium)))]; return miss.length ? `<div class="msg err">${esc(t.no_tariff.replace("{m}", miss.join(", ")))}</div>` : ""; })()}
          ${r.price_estimated ? `<p class="muted small">ⓘ ${esc(t.price_est)}</p>` : ""}
          <div class="tablewrap"><table class="yrs"><thead><tr><th>${esc(t.year_h)}</th><th class="r">${esc(t.saved_h)}</th><th class="r">${esc(t.net || "Bilans")}</th></tr></thead><tbody>${yrs}</tbody></table></div>`;
      }
    }
    return `${chips}${body}<h3>${esc(t.expenses)}</h3>${this.renderList("investments")}`;
  }

  projTemplate(kind) {
    const t = this.t;
    const el = this.media.find((m) => m.id === "electricity") || this.media.find((m) => /kwh/i.test(m.unit || "")) || this.media[0] || {};
    const gas = this.media.find((m) => m.id === "gas") || {};
    const zone0 = (m) => (m.zones || [{ id: "all" }])[0].id;
    const invs = (this._data.investments || []).map((i) => i.date).filter(Boolean).sort();
    const base = { name: t.tpl[kind] || "", start_date: invs[0] || new Date().toISOString().slice(0, 10), horizon_years: 25, growth_pct: 0, rules: [] };
    if (kind === "pv") base.rules.push({ id: uid("r"), label: t.tpl_pv_rule, type: "qty", effect: "avoid", medium: el.id, zone: zone0(el), sources: [{ from: null, ids: [] }] });
    if (kind === "ev") {
      const fuel = this.media.find((m) => m.id === "fuel") || {};
      base.rules.push(
        { id: uid("r"), label: t.tpl_ev_fuel, type: "qty", effect: "avoid", medium: fuel.id || "fuel", zone: "all", sources: [{ from: null, ids: [], factor: 0.41 }] },
        { id: uid("r"), label: t.tpl_ev_el, type: "qty", effect: "add", medium: el.id, zone: (el.zones || [{ id: "all" }]).slice(-1)[0].id, sources: [{ from: null, ids: [] }] });
    }
    if (kind === "hp") base.rules.push(
      { id: uid("r"), label: t.tpl_hp_gas, type: "qty", effect: "avoid", medium: gas.id, zone: "all", sources: [{ from: null, ids: [], factor: 0.106 }] },
      { id: uid("r"), label: t.tpl_hp_el, type: "qty", effect: "add", medium: el.id, zone: zone0(el), sources: [{ from: null, ids: [] }] });
    return base;
  }

  renderProjDialog() {
    const t = this.t, o = this._pd.obj;
    const opt = (vals, cur, labels) => vals.map((v) => `<option value="${esc(v)}" ${v === cur ? "selected" : ""}>${esc(labels ? labels[v] || v : v)}</option>`).join("");
    const rules = (o.rules || []).map((r, i) => {
      const typ = r.type || "qty";
      const m = this.media.find((x) => x.id === r.medium);
      const zsel = typ === "qty" ? `<label class="half">${esc(t.r_zone)}<select data-p="rules.${i}.zone">${opt(this.zones(r.medium), r.zone, Object.fromEntries(this.zones(r.medium).map((z) => [z, this.zName(r.medium, z)])))}</select></label>` : "";
      return `<div class="rule" style="--mc:${typ === "money" ? "var(--primary-color)" : this.color(r.medium)}">
        <div class="grid"><label class="wide">${esc(t.r_label)}<input data-p="rules.${i}.label" value="${esc(r.label || "")}"></label>
        <label class="half">${esc(t.r_type)}<select data-p="rules.${i}.type" data-rr>${opt(["qty", "fixed", "money"], typ, t.types)}</select></label>
        <label class="half">${esc(t.r_effect)}<select data-p="rules.${i}.effect">${opt(["avoid", "add"], r.effect || "avoid", t.effects)}</select></label>
        ${typ !== "money" ? `<label class="half">${esc(t.r_medium)}<select data-p="rules.${i}.medium" data-rr>${opt(this.media.map((x) => x.id), r.medium, Object.fromEntries(this.media.map((x) => [x.id, this.mName(x.id)])))}</select></label>${zsel}` : ""}
        ${typ === "money" ? `<label class="half">${esc(t.r_amount)}<input type="number" step="any" data-num data-p="rules.${i}.amount_per_year" value="${r.amount_per_year ?? ""}"></label><label class="half"></label>
          <label class="half">${esc(t.r_from)}<input type="date" data-p="rules.${i}.from" value="${esc(r.from || "")}"></label><label class="half">${esc(t.r_to)}<input type="date" data-p="rules.${i}.to" value="${esc(r.to || "")}"></label>` : ""}
        </div>
        ${typ === "qty" ? `<div class="lbl">${esc(t.meters)}${m ? ` → ${esc(m.unit || "")}` : ""}</div>${this.srcEditor(`rules.${i}.sources`, r.sources)}
          ${r.medium === "gas" ? `<p class="muted small">${esc(t.hint_hp)}</p>` : r.medium === "fuel" ? `<p class="muted small">${esc(t.hint_ev)}</p>` : ""}
          <label class="mt">${esc(t.r_est)}<input type="number" step="any" data-num data-p="rules.${i}.estimate_per_year" value="${r.estimate_per_year ?? ""}"></label>` : ""}
        <button type="button" class="link danger" data-act="rm" data-p="rules" data-i="${i}">${esc(t.del_rule)}</button></div>`;
    }).join("");
    const tpls = !o.id && !(o.rules || []).length ? `<div class="lbl">${esc(t.templates)}</div><div class="tpls">${["pv", "hp", "ev", "blank"].map((k) => `<button type="button" data-act="tpl" data-tpl="${k}">${esc(t.tpl[k])}</button>`).join("")}</div>` : "";
    return `<div class="backdrop"><div class="dialog edit" data-w="p">
      <div class="dhead"><span class="grab"></span><h2>${esc(o.id ? t.edit_proj : t.new_proj)}</h2><button type="button" class="x" id="pdx">✕</button></div>
      <div class="dbody">${this.datalists()}${tpls}
        <div class="grid"><label class="wide">${esc(t.name)} *<input data-p="name" value="${esc(o.name || "")}"></label>
        <label class="half">${esc(t.start_date)}<input type="date" data-p="start_date" value="${esc(o.start_date || "")}"></label>
        <label class="half">${esc(t.horizon)}<input type="number" data-num data-p="horizon_years" value="${o.horizon_years ?? 25}"></label>
        <label class="half">${esc(t.growth)}<input type="number" step="any" data-num data-p="growth_pct" value="${o.growth_pct ?? 0}"></label></div>
        <h4>${esc(t.rules_h)}</h4>${rules}
        <button type="button" class="small" data-act="add" data-p="rules" data-tpl="rule">${esc(t.add_rule)}</button>
        <label class="mt">${esc(t.note)}<textarea data-p="note" rows="2">${esc(o.note || "")}</textarea></label>
        ${this._pd.error ? `<div class="msg err">${esc(this._pd.error)}</div>` : ""}</div>
      <div class="actions">${o.id ? `<button type="button" class="danger" id="pddel">${esc(t.del_proj)}</button>` : ""}<span class="sp"></span><button type="button" id="pdcancel">${esc(t.cancel)}</button><button type="button" class="primary" id="pdsave">${esc(t.save)}</button></div></div></div>`;
  }

  _rerenderKeep() {
    const b = this.shadowRoot.querySelector(".dbody"); const top = b ? b.scrollTop : 0;
    const y = window.scrollY;
    this._render();
    const nb = this.shadowRoot.querySelector(".dbody"); if (nb) nb.scrollTop = top;
    window.scrollTo(0, y);
  }

  _bindEdit() {
    const root = this.shadowRoot;
    const target = (el) => (el.closest("[data-w]")?.dataset.w === "p" ? this._pd?.obj : this._workSettings());
    root.querySelectorAll("[data-p]").forEach((el) => {
      if (el.tagName === "BUTTON") return;
      el.addEventListener("change", () => {
        let v = el.value;
        if (el.hasAttribute("data-num")) v = v === "" ? undefined : Number(v);
        else if (v === "") v = el.type === "date" ? null : "";
        setP(target(el), el.dataset.p, v);
        if (el.hasAttribute("data-rr")) this._rerenderKeep();
      });
    });
    root.querySelectorAll("[data-sync]").forEach((el) => el.addEventListener("change", () => { this._workSettings().sync[el.dataset.sync] = el.value.trim(); }));
    root.querySelectorAll("[data-addto]").forEach((el) => el.addEventListener("change", () => {
      const v = el.value.trim(); if (!v) return;
      const obj = target(el); const arr = getP(obj, el.dataset.addto) || [];
      if (!arr.includes(v)) arr.push(v);
      setP(obj, el.dataset.addto, arr); this._rerenderKeep();
    }));
    root.querySelectorAll("[data-act]").forEach((el) => el.addEventListener("click", () => {
      const obj = target(el), act = el.dataset.act;
      if (act === "add") {
        const arr = getP(obj, el.dataset.p) || [];
        const el0 = this.media[0] || {};
        arr.push(el.dataset.tpl === "src" ? { from: null, ids: [] } : { id: uid("r"), label: "", type: "qty", effect: "avoid", medium: el0.id, zone: (el0.zones || [{ id: "all" }])[0].id, sources: [{ from: null, ids: [] }] });
        setP(obj, el.dataset.p, arr);
      } else if (act === "rm") {
        getP(obj, el.dataset.p).splice(Number(el.dataset.i), 1);
      } else if (act === "addzone") {
        const m = obj.media[Number(el.dataset.i)]; m.zones.push({ id: uid("z"), name: "" });
      } else if (act === "rmzone") {
        const m = obj.media[Number(el.dataset.i)]; const z = m.zones.splice(Number(el.dataset.j), 1)[0]; delete m.statistics[z.id];
      } else if (act === "addmedium") {
        obj.media.push({ id: uid("m"), name: this.t.new_medium, unit: "", zones: [{ id: "all", name: "" }], statistics: {} });
      } else if (act === "rmmedium") {
        if (!confirm(this.t.confirm_del_medium)) return;
        obj.media.splice(Number(el.dataset.i), 1);
      } else if (act === "tpl") {
        const go = () => { const keepName = obj.name; Object.assign(obj, this.projTemplate(el.dataset.tpl)); if (keepName) obj.name = keepName; this._rerenderKeep(); };
        if (el.dataset.tpl === "ev" && !this.media.find((m) => m.id === "fuel")) {
          const st = JSON.parse(JSON.stringify(this.settings));
          st.media.push({ id: "fuel", name: "", unit: "l", zones: [{ id: "all", name: "" }], statistics: {} });
          this.ws({ type: "settings", settings: st }).then((res) => { this._data.settings = res; go(); }).catch((e) => { this._pd.error = `${this.t.error}: ${e.message || e}`; this._rerenderKeep(); });
          return;
        }
        go(); return;
      }
      this._rerenderKeep();
    }));
  }

  _bindInvest() {
    const $ = (s) => this.shadowRoot.querySelector(s);
    this.shadowRoot.querySelectorAll("[data-proj]").forEach((b) => b.addEventListener("click", async () => { this._proj = b.dataset.proj; this._render(); await this._loadRoi(); this._render(); }));
    this.shadowRoot.querySelectorAll(".yhit").forEach((el) => {
      const go = () => this._selectRoiYear(Number(el.dataset.yr));
      el.addEventListener("click", go);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      el.addEventListener("mouseenter", () => { if (window.matchMedia("(hover: hover)").matches) go(); });
    });
    this.shadowRoot.querySelectorAll("tr[data-yrow]").forEach((el) => el.addEventListener("click", () => {
      this._selectRoiYear(Number(el.dataset.yrow));
      this.shadowRoot.querySelector(".chart")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }));
    this._bindYearDetail();
    $("#newproj")?.addEventListener("click", () => { this._pd = { obj: { horizon_years: 25, growth_pct: 0, rules: [] } }; this._render(); });
    $("#editproj")?.addEventListener("click", () => { const p = this.projects.find((x) => x.id === this._proj); this._pd = { obj: JSON.parse(JSON.stringify(p)) }; this._render(); });
    if (!this._pd) return;
    const close = () => { this._pd = null; this._render(); };
    $("#pdx")?.addEventListener("click", close);
    $("#pdcancel")?.addEventListener("click", close);
    $("#pddel")?.addEventListener("click", async () => {
      if (!confirm(this.t.confirm_del_proj)) return;
      await this.ws({ type: "delete", collection: "projects", item_id: this._pd.obj.id });
      this._pd = null; await this._load(); await this._loadRoi(); this._render();
    });
    $("#pdsave")?.addEventListener("click", async () => {
      const o = JSON.parse(JSON.stringify(this._pd.obj));
      if (!o.name) { this._pd.error = this.t.name + " *"; this._rerenderKeep(); return; }
      (o.rules || []).forEach((r) => { if (r.sources) r.sources = this._cleanSources(r.sources); if (r.type === "money") { delete r.medium; delete r.zone; delete r.sources; } if (r.type === "fixed") { delete r.zone; delete r.sources; delete r.estimate_per_year; } });
      try {
        const saved = await this.ws({ type: "save", collection: "projects", item: o });
        this._proj = saved.id; this._pd = null; this._msg = this.t.saved;
        await this._load(); await this._loadRoi(); this._render();
      } catch (e) { this._pd.error = `${this.t.error}: ${e.message || e}`; this._rerenderKeep(); }
    });
  }

};
