/* Utility Costs – summary charts, export, table import, notifications, ROI cache info */
const M = {
  en: {
    tc_title: "Price history", tc_vs: "vs previous tariff", tc_first: "since the first tariff", tc_fixed: "Fixed fee / month", tc_until: "until now", tc_hint: "Tap a period to see the tariff", tc_cur: "current", tc_sup: "Supplier", tc_days: "{n} days", chart_month: "Monthly cost", md_total: "Total", md_prev: "Same month last year", md_inv: "Invoices covering this month", md_part: "data for {d} of {n} days", md_none: "No data for this month", md_hint: "Tap a month to see the details", prev_year: "Previous year", vs_prev: "vs same period last year", forecast_y: "Year forecast",
    export_x: "Excel", export_c: "CSV", import_t: "Import from Excel / CSV", import_b: "Import",
    imp_intro: "First row = column names (English, Polish or German). Required columns are bold. Dates: 2026-03-31, 31.03.2026 or Excel dates; amounts may use a comma (1 234,56 zł). Unknown suppliers are added automatically, duplicates are skipped.",
    imp_col: "Column", imp_desc: "Meaning", imp_ex: "Example", imp_tpl: "Download template", imp_file: "Choose file (.xlsx, .csv)",
    imp_check: "Check file", imp_save: "Import {n} rows", imp_ok: "{n} new", imp_dup: "{n} duplicates skipped", imp_err: "{n} rows with errors",
    imp_missing: "Missing required columns: {c}", imp_sup: "New suppliers: {s}", imp_done: "Imported: {n}", imp_row: "row {r}",
    imp_errs: { missing: "empty required field", medium: "unknown medium", date: "bad date", number: "bad number", bad_period: "period end before start" },
    imp_cols: {
      medium: "electricity, gas, water, fuel (or the name of your medium)", period_from: "billing period start", period_to: "billing period end",
      amount: "gross amount", quantity: "quantity (kWh, m³…)", qty_day: "quantity day zone", qty_night: "quantity night zone", supplier: "supplier name",
      number: "invoice number", kind: "settlement / forecast / correction / periodic", issue_date: "issue date", due_date: "due date",
      balance: "overpayment (+) / extra charge (−)", note: "note", paid: "yes / no", valid_from: "valid from", valid_to: "valid to (empty = open)",
      price: "unit price", price_day: "unit price day", price_night: "unit price night", fixed_monthly: "fixed fee per month", name: "tariff name",
      date: "purchase date", description: "what was bought", category: "panels, inverters, batteries, mounting, cabling, other", project: "project name (empty = current)", comment: "comment",
    },
    tabs_h: "Tabs in the menu", tabs_hint: "Unticked tabs are hidden from the menu after saving. Their data and calculations stay.", n_h: "Notifications", n_on: "Send notifications", n_days: "Instalment reminder (days before)", n_dev: "Invoice vs meters alert from (%)", n_svc: "Also send via notify service",
    n_hint: "Notifications appear in Home Assistant; optionally also on your phone (e.g. notify.mobile_app_…).",
    roi_at: "Calculated", roi_cached: "Saved result – only the current month is recalculated",
  },
  pl: {
    tc_title: "Historia cen", tc_vs: "vs poprzednia taryfa", tc_first: "od pierwszej taryfy", tc_fixed: "Opłata stała / mies.", tc_until: "do teraz", tc_hint: "Kliknij okres, aby zobaczyć taryfę", tc_cur: "obecna", tc_sup: "Sprzedawca", tc_days: "{n} dni", chart_month: "Koszt miesięczny", md_total: "Razem", md_prev: "Ten sam miesiąc rok temu", md_inv: "Faktury obejmujące ten miesiąc", md_part: "dane z {d} z {n} dni", md_none: "Brak danych za ten miesiąc", md_hint: "Kliknij miesiąc, aby zobaczyć szczegóły", prev_year: "Poprzedni rok", vs_prev: "vs ten sam okres rok temu", forecast_y: "Prognoza roczna",
    export_x: "Excel", export_c: "CSV", import_t: "Import z Excela / CSV", import_b: "Import",
    imp_intro: "Pierwszy wiersz = nazwy kolumn (po polsku, angielsku lub niemiecku). Wymagane kolumny są pogrubione. Daty: 2026-03-31, 31.03.2026 lub daty Excela; kwoty mogą mieć przecinek (1 234,56 zł). Nieznani dostawcy zostaną dodani, duplikaty pominięte.",
    imp_col: "Kolumna", imp_desc: "Znaczenie", imp_ex: "Przykład", imp_tpl: "Pobierz szablon", imp_file: "Wybierz plik (.xlsx, .csv)",
    imp_check: "Sprawdź plik", imp_save: "Importuj {n} wierszy", imp_ok: "{n} nowych", imp_dup: "{n} duplikatów pominiętych", imp_err: "{n} wierszy z błędami",
    imp_missing: "Brak wymaganych kolumn: {c}", imp_sup: "Nowi dostawcy: {s}", imp_done: "Zaimportowano: {n}", imp_row: "wiersz {r}",
    imp_errs: { missing: "puste wymagane pole", medium: "nieznane medium", date: "zła data", number: "zła liczba", bad_period: "koniec okresu przed początkiem" },
    imp_cols: {
      medium: "prąd, gaz, woda, paliwo (lub nazwa Twojego medium)", period_from: "początek okresu rozliczeniowego", period_to: "koniec okresu",
      amount: "kwota brutto", quantity: "ilość (kWh, m³…)", qty_day: "ilość strefa dzień", qty_night: "ilość strefa noc", supplier: "nazwa dostawcy",
      number: "numer faktury", kind: "rozliczenie / prognoza / korekta / okresowa", issue_date: "data wystawienia", due_date: "termin płatności",
      balance: "nadpłata (+) / niedopłata (−)", note: "uwagi", paid: "tak / nie", valid_from: "obowiązuje od", valid_to: "obowiązuje do (puste = bez końca)",
      price: "cena jednostkowa", price_day: "cena strefa dzień", price_night: "cena strefa noc", fixed_monthly: "opłata stała miesięcznie", name: "nazwa taryfy",
      date: "data zakupu", description: "co kupiono", category: "panele, falowniki, baterie, montaż, okablowanie, inne", project: "nazwa projektu (puste = bieżący)", comment: "komentarz",
    },
    tabs_h: "Zakładki w menu", tabs_hint: "Odznaczone zakładki znikną z menu po zapisaniu. Ich dane i obliczenia zostają.", n_h: "Powiadomienia", n_on: "Wysyłaj powiadomienia", n_days: "Przypomnienie o racie (dni przed)", n_dev: "Alert faktura vs liczniki od (%)", n_svc: "Wysyłaj też przez usługę notify",
    n_hint: "Powiadomienia pojawiają się w Home Assistant, opcjonalnie też na telefonie (np. notify.mobile_app_…).",
    roi_at: "Przeliczono", roi_cached: "Zapisany wynik – przeliczany jest tylko bieżący miesiąc",
  },
  de: {
    tc_title: "Preisverlauf", tc_vs: "vs. vorheriger Tarif", tc_first: "seit dem ersten Tarif", tc_fixed: "Grundgebühr / Monat", tc_until: "bis heute", tc_hint: "Zeitraum antippen für den Tarif", tc_cur: "aktuell", tc_sup: "Anbieter", tc_days: "{n} Tage", chart_month: "Monatliche Kosten", md_total: "Summe", md_prev: "Gleicher Monat im Vorjahr", md_inv: "Rechnungen für diesen Monat", md_part: "Daten für {d} von {n} Tagen", md_none: "Keine Daten für diesen Monat", md_hint: "Monat antippen für Details", prev_year: "Vorjahr", vs_prev: "vs. gleicher Zeitraum Vorjahr", forecast_y: "Jahresprognose",
    export_x: "Excel", export_c: "CSV", import_t: "Import aus Excel / CSV", import_b: "Import",
    imp_intro: "Erste Zeile = Spaltennamen (Deutsch, Englisch oder Polnisch). Pflichtspalten sind fett. Datum: 2026-03-31, 31.03.2026 oder Excel-Datum; Beträge mit Komma möglich (1.234,56 €). Unbekannte Anbieter werden angelegt, Duplikate übersprungen.",
    imp_col: "Spalte", imp_desc: "Bedeutung", imp_ex: "Beispiel", imp_tpl: "Vorlage herunterladen", imp_file: "Datei wählen (.xlsx, .csv)",
    imp_check: "Datei prüfen", imp_save: "{n} Zeilen importieren", imp_ok: "{n} neu", imp_dup: "{n} Duplikate übersprungen", imp_err: "{n} Zeilen mit Fehlern",
    imp_missing: "Pflichtspalten fehlen: {c}", imp_sup: "Neue Anbieter: {s}", imp_done: "Importiert: {n}", imp_row: "Zeile {r}",
    imp_errs: { missing: "Pflichtfeld leer", medium: "unbekanntes Medium", date: "ungültiges Datum", number: "ungültige Zahl", bad_period: "Ende vor Beginn" },
    imp_cols: {
      medium: "Strom, Gas, Wasser, Kraftstoff (oder Name Ihres Mediums)", period_from: "Beginn Abrechnungszeitraum", period_to: "Ende Zeitraum",
      amount: "Bruttobetrag", quantity: "Menge (kWh, m³…)", qty_day: "Menge Tag", qty_night: "Menge Nacht", supplier: "Anbieter",
      number: "Rechnungsnummer", kind: "Abrechnung / Abschlag / Korrektur / periodisch", issue_date: "Rechnungsdatum", due_date: "fällig am",
      balance: "Guthaben (+) / Nachzahlung (−)", note: "Notiz", paid: "ja / nein", valid_from: "gültig ab", valid_to: "gültig bis (leer = offen)",
      price: "Arbeitspreis", price_day: "Preis Tag", price_night: "Preis Nacht", fixed_monthly: "Grundgebühr pro Monat", name: "Tarifname",
      date: "Kaufdatum", description: "was gekauft wurde", category: "Module, Wechselrichter, Batterien, Montage, Verkabelung, Sonstiges", project: "Projektname (leer = aktuelles)", comment: "Kommentar",
    },
    tabs_h: "Registerkarten im Menü", tabs_hint: "Abgewählte Registerkarten werden nach dem Speichern ausgeblendet. Daten und Berechnungen bleiben erhalten.", n_h: "Benachrichtigungen", n_on: "Benachrichtigungen senden", n_days: "Erinnerung an Abschlag (Tage vorher)", n_dev: "Warnung Rechnung vs. Zähler ab (%)", n_svc: "Zusätzlich über notify-Dienst",
    n_hint: "Benachrichtigungen erscheinen in Home Assistant, optional auch auf dem Handy (z. B. notify.mobile_app_…).",
    roi_at: "Berechnet", roi_cached: "Gespeichertes Ergebnis – nur der aktuelle Monat wird neu berechnet",
  },
};

/* columns shown in the import window: key, required, example */
const IMP = {
  invoices: [["medium", 1, "gas"], ["period_from", 1, "2025-07-12"], ["period_to", 1, "2026-07-09"], ["amount", 1, "1060.40"], ["quantity", 0, "915"],
    ["qty_day", 0, "41"], ["qty_night", 0, "648"], ["supplier", 0, "BlueFlame Gas"], ["number", 0, "BF-2026-0077"], ["kind", 0, "settlement"],
    ["issue_date", 0, "2026-07-15"], ["due_date", 0, "2026-07-29"], ["balance", 0, "-142.60"], ["note", 0, ""]],
  installments: [["medium", 1, "gas"], ["amount", 1, "76"], ["due_date", 1, "2026-11-20"], ["period_from", 0, "2026-10-01"], ["period_to", 0, "2026-11-30"],
    ["supplier", 0, "BlueFlame Gas"], ["paid", 0, "no"], ["note", 0, ""]],
  tariffs: [["medium", 1, "electricity"], ["valid_from", 1, "2026-01-01"], ["valid_to", 0, ""], ["price", 0, "3.41"], ["price_day", 0, "0.286"],
    ["price_night", 0, "0.145"], ["fixed_monthly", 0, "13.90"], ["name", 0, "G12"], ["supplier", 0, "Northgrid Energy"], ["note", 0, ""]],
  investments: [["date", 1, "2022-03-14"], ["amount", 1, "6200"], ["description", 1, "Solar panels 10 kWp"], ["category", 0, "panels"], ["project", 0, ""], ["comment", 0, ""]],
};

export const makeMore = ({ esc }) => class {
  get tm() { const l = (this.locale || "en").split("-")[0]; return M[l] || M.en; }

  /* ---------- summary chart + YoY ---------- */
  sumChart(s, prev) {
    const tm = this.tm, media = this.media;
    const cost = (mo, mid) => Number(mo?.media?.[mid]?.cost || 0);
    const tot = (mo) => media.reduce((a, m) => a + cost(mo, m.id), 0);
    const pm = {}; (prev?.months || []).forEach((mo) => { pm[mo.month.slice(5)] = mo; });
    const months = [];
    for (let i = 1; i <= 12; i++) { const k = String(i).padStart(2, "0"); months.push({ k, cur: s.months.find((m) => m.month.slice(5) === k), prev: pm[k] }); }
    const maxV = Math.max(1, ...months.map((m) => Math.max(m.cur ? tot(m.cur) : 0, m.prev ? tot(m.prev) : 0)));
    const W = 600, H = 190, pb = 20, pt = 10, bw = W / 12;
    const Y = (v) => pt + (H - pt - pb) * (1 - v / maxV);
    let bars = "", dots = "", line = "";
    months.forEach((m, i) => {
      const x = i * bw + bw * 0.18, w = bw * 0.64;
      let y0 = H - pb;
      if (m.cur) media.forEach((md) => {
        const v = cost(m.cur, md.id); if (!v) return;
        const h = (H - pt - pb) * (v / maxV);
        bars += `<rect x="${x.toFixed(1)}" y="${(y0 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${this.color(md.id)}"><title>${esc(this.mName(md.id))}: ${this.money(v)}</title></rect>`;
        y0 -= h;
      });
      if (m.prev && tot(m.prev)) {
        const cx = (i * bw + bw / 2).toFixed(1), cy = Y(tot(m.prev)).toFixed(1);
        line += `${line ? "L" : "M"}${cx},${cy} `;
        dots += `<line x1="${(i * bw + bw * 0.12).toFixed(1)}" x2="${(i * bw + bw * 0.88).toFixed(1)}" y1="${cy}" y2="${cy}" class="pdot"><title>${tm.prev_year}: ${this.money(tot(m.prev))}</title></line>`;
      }
      const name = new Date(`2000-${m.k}-01T00:00:00`).toLocaleDateString(this.locale, { month: "narrow" });
      bars += `<text x="${(i * bw + bw / 2).toFixed(1)}" y="${H - 5}" text-anchor="middle">${esc(name)}</text>`;
    });
    // year over year for the same period (months that have data this year)
    const have = months.filter((m) => m.cur && tot(m.cur));
    const curSum = have.reduce((a, m) => a + tot(m.cur), 0);
    const now = new Date(), curK = String(now.getMonth() + 1).padStart(2, "0");
    const part = (m) => (Number(s.year) === now.getFullYear() && m.k === curK ? now.getDate() / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() : 1);
    const prevSum = have.reduce((a, m) => a + (m.prev ? tot(m.prev) * part(m) : 0), 0);
    const yoy = prevSum ? ((curSum - prevSum) / prevSum) * 100 : null;
    const yoyTxt = yoy === null ? "" : `<span class="yoy ${yoy > 0 ? "neg" : "pos"}">${yoy > 0 ? "▲" : "▼"} ${this.num(Math.abs(yoy), 1)}% <small>${esc(tm.vs_prev)} (${this.money(prevSum)})</small></span>`;
    const sel = this._monSel(s, months, tot);
    const hits = months.map((m, i) => `<rect x="${(i * bw).toFixed(1)}" y="0" width="${bw.toFixed(1)}" height="${H}" class="yhit${m.k === sel ? " on" : ""}" data-mon="${m.k}" tabindex="0" role="button" aria-label="${m.k}"><title>${esc(new Date(`2000-${m.k}-01T00:00:00`).toLocaleDateString(this.locale, { month: "long" }))}: ${this.money(m.cur ? tot(m.cur) : 0)}</title></rect>`).join("");
    this._monCtx = { s, months, tot, cost };
    return `<div class="chart card schart"><div class="ctitle"><b>${esc(tm.chart_month)}</b>${yoyTxt}</div>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img">${bars}${line ? `<path d="${line}" class="pline"/>` : ""}${dots}${hits}</svg>
      <div class="legend">${media.map((m) => `<span><i class="lg" style="background:${this.color(m.id)}"></i>${esc(this.mName(m.id))}</span>`).join("")}${line ? `<span><i class="lg pdl"></i>${esc(tm.prev_year)}</span>` : ""}</div>
      <div class="ydet mdet">${this.monthDetail(sel)}</div></div>`;
  }

  _monSel(s, months, tot) {
    const keys = months.map((m) => m.k);
    if (this._monYear !== s.year || !keys.includes(this._mon)) {
      const now = new Date(), k = String(now.getMonth() + 1).padStart(2, "0");
      const withData = months.filter((m) => m.cur && tot(m.cur)).map((m) => m.k);
      this._mon = Number(s.year) === now.getFullYear() ? k : (withData[withData.length - 1] || "01");
      this._monYear = s.year;
    }
    return this._mon;
  }

  monthDetail(k) {
    const tm = this.tm, c = this._monCtx;
    if (!c) return "";
    const i = c.months.findIndex((m) => m.k === k), m = c.months[i];
    if (!m) return `<p class="muted small">${esc(tm.md_hint)}</p>`;
    const mk = `${c.s.year}-${k}`;
    const title = new Date(`${mk}-01T00:00:00`).toLocaleDateString(this.locale, { month: "long", year: "numeric" });
    const total = m.cur ? c.tot(m.cur) : 0, prevT = m.prev ? c.tot(m.prev) : 0;
    const diff = prevT ? ((total - prevT) / prevT) * 100 : null;
    const rows = this.media.map((md) => {
      const x = m.cur?.media?.[md.id]; if (!x || !(x.cost || x.qty_total)) return "";
      const px = m.prev?.media?.[md.id];
      const part = x.days && x.data_days < x.days ? `<small>${esc(tm.md_part.replace("{d}", x.data_days).replace("{n}", x.days))}</small>` : "";
      return `<div class="rrow"><span class="rlbl"><span><span class="dot" style="background:${this.color(md.id)}"></span>${esc(this.mName(md.id))}</span><small>${this.num(x.qty_total, 1)} ${esc(this.unit(md.id))}${px ? ` · ${esc(tm.prev_year)}: ${this.money(px.cost || 0)}` : ""}</small>${part}</span><b>${this.money(x.cost)}</b></div>${this.partRows(md.id, x.parts)}`;
    }).join("");
    const a = `${mk}-01`, b = `${mk}-${String(new Date(Number(c.s.year), Number(k), 0).getDate()).padStart(2, "0")}`;
    const inv = (c.s.invoices || []).filter((v) => (v.period_from || "") <= b && (v.period_to || v.period_from || "") >= a);
    const invl = inv.length ? `<div class="ysub">${esc(tm.md_inv)} (${inv.length})</div>${inv.map((v) => `<div class="rrow"><span class="rlbl"><span><span class="dot" style="background:${this.color(v.medium)}"></span>${esc(this.mName(v.medium))}${v.number ? ` · ${esc(v.number)}` : ""}</span><small>${this.date(v.period_from)} – ${this.date(v.period_to)}</small></span><b>${this.money(v.amount)}</b></div>`).join("")}` : "";
    return `<div class="yhead"><button type="button" class="yarr" data-mstep="-1" ${i <= 0 ? "disabled" : ""}>‹</button><b>${esc(title)}</b><small></small><button type="button" class="yarr" data-mstep="1" ${i >= 11 ? "disabled" : ""}>›</button></div>
      <div class="ystats">
        <div><span>${esc(tm.md_total)}</span><b>${this.money(total)}</b></div>
        <div><span>${esc(tm.md_prev)}</span><b>${prevT ? this.money(prevT) : "–"}</b>${diff === null ? "" : `<small class="${diff > 0 ? "neg" : "pos"}">${diff > 0 ? "▲" : "▼"} ${this.num(Math.abs(diff), 1)}%</small>`}</div>
      </div>
      ${rows || `<p class="muted small">${esc(tm.md_none)}</p>`}${invl}`;
  }

  /* usage parts of a medium (e.g. gas: heating / hot water) */
  partList(mid, parts) {
    const md = this.media.find((m) => m.id === mid) || {}, defs = md.parts || [];
    if (!parts || !defs.length) return [];
    const total = Object.values(parts).reduce((a, p) => a + (p.qty || 0), 0);
    const list = defs.map((d, i) => ({ id: d.id, name: d.name || d.id, qty: parts[d.id]?.qty || 0, cost: parts[d.id]?.cost || 0, i }));
    if (parts.rest?.qty > 0.0005) list.push({ id: "rest", name: this.t.part_rest, qty: parts.rest.qty, cost: parts.rest.cost, i: -1 });
    return list.map((p) => ({ ...p, pct: total ? (p.qty / total) * 100 : 0 }));
  }

  partColor(mid, i) {
    return i < 0 ? "var(--divider-color)" : `color-mix(in srgb, ${this.color(mid)} ${[100, 55, 30, 75][i % 4]}%, var(--card-background-color, #fff))`;
  }

  partRows(mid, parts) {
    const list = this.partList(mid, parts);
    if (!list.length) return "";
    return `<div class="prows">${list.map((p) => `<div class="prow"><span><i style="background:${this.partColor(mid, p.i)}"></i>${esc(p.name)}</span><small>${this.num(p.qty, 1)} ${esc(this.unit(mid))} · ${this.num(p.pct, 0)}%</small><b>${this.money(p.cost)}</b></div>`).join("")}</div>`;
  }

  partBar(mid, parts) {
    const list = this.partList(mid, parts);
    if (!list.length) return "";
    return `<div class="pbar" title="${esc(list.map((p) => `${p.name}: ${this.num(p.pct, 0)}%`).join(" · "))}">${list.map((p) => `<span style="width:${p.pct.toFixed(2)}%;background:${this.partColor(mid, p.i)}"></span>`).join("")}</div>
      <small class="plegend">${list.filter((p) => p.id !== "rest").map((p) => `${esc(p.name)} ${this.num(p.pct, 0)}%`).join(" · ")}</small>`;
  }

  _selectMonth(k) {
    this._mon = k;
    const root = this.shadowRoot;
    root.querySelectorAll("[data-mon]").forEach((el) => el.classList.toggle("on", el.dataset.mon === k));
    const box = root.querySelector(".mdet");
    if (box) { box.innerHTML = this.monthDetail(k); this._bindMonthDetail(); }
  }

  _bindMonthDetail() {
    this.shadowRoot.querySelectorAll("[data-mstep]").forEach((b) => b.addEventListener("click", () => {
      const n = Number(this._mon) + Number(b.dataset.mstep);
      if (n >= 1 && n <= 12) this._selectMonth(String(n).padStart(2, "0"));
    }));
  }

  /* tariff price history: one step chart per selected medium with more than one tariff */
  tariffCharts(rows) {
    if (!this._media.length) return "";
    return this._media.map((mid) => {
      const rs = rows.filter((r) => r.medium === mid && r.valid_from);
      return rs.length > 1 ? this.tariffChart(mid, rs) : "";
    }).join("");
  }

  _tarSegs(mid, rows) {
    const rs = [...rows].sort((a, b) => String(a.valid_from).localeCompare(String(b.valid_from)));
    const today = new Date().toISOString().slice(0, 10);
    const day = (d) => Date.parse(`${d}T00:00:00Z`) / 864e5;
    return rs.map((r, i) => {
      const next = rs[i + 1]?.valid_from;
      let end = r.valid_to ? String(r.valid_to) : (next || today);
      if (next && next < end) end = next;
      const a = day(r.valid_from), b = Math.max(day(end) + (r.valid_to && end === String(r.valid_to) ? 1 : 0), a + 1);
      return { r, a, b, open: !r.valid_to && !next, i };
    });
  }

  _tarColors(mid) {
    const base = this.color(mid), extra = ["#8E6CC2", "#E0A53A", "#3A9BE0", "#D2557A"];
    return this.zones(mid).map((z, i) => (i ? extra[(i - 1) % extra.length] : base));
  }

  tariffChart(mid, rows) {
    const tm = this.tm, segs = this._tarSegs(mid, rows), zones = this.zones(mid), cols = this._tarColors(mid);
    const W = 600, H = 170, pt = 10, pb = 4;
    const t0 = segs[0].a, t1 = Math.max(...segs.map((s) => s.b), Date.now() / 864e5);
    const vals = segs.flatMap((s) => zones.map((z) => Number(s.r.prices?.[z])).filter((v) => Number.isFinite(v) && v > 0));
    if (!vals.length) return "";
    let lo = Math.min(...vals), hi = Math.max(...vals);
    const pad = (hi - lo) * 0.12 || hi * 0.1 || 1;
    lo = Math.max(0, lo - pad); hi += pad;
    const X = (d) => ((d - t0) / (t1 - t0 || 1)) * W, Y = (v) => pt + (H - pt - pb) * (1 - (v - lo) / (hi - lo));
    let grid = "", xl = "";
    const y0 = new Date(t0 * 864e5).getUTCFullYear(), y1 = new Date(t1 * 864e5).getUTCFullYear();
    const ystep = Math.ceil((y1 - y0 + 1) / 8);
    for (let y = y0; y <= y1 + 1; y++) {
      const d = Date.UTC(y, 0, 1) / 864e5;
      if (d < t0 || d > t1) continue;
      const x = X(d).toFixed(1);
      grid += `<line x1="${x}" x2="${x}" y1="${pt}" y2="${H - pb}" class="tgrid"/>`;
      if ((y - y0) % ystep === 0) { const pc = (X(d) / W) * 100; xl += `<span style="left:${pc.toFixed(2)}%" class="${pc < 4 ? "l" : pc > 96 ? "r" : ""}">${y}</span>`; }
    }
    const lines = zones.map((z, zi) => {
      let d = "", prev = null;
      segs.forEach((s) => {
        const v = Number(s.r.prices?.[z]);
        if (!Number.isFinite(v) || v <= 0) { prev = null; return; }
        const y = Y(v).toFixed(1);
        d += `${prev !== null && Math.abs(prev.b - s.a) < 1.5 ? "L" : "M"}${X(s.a).toFixed(1)},${y} L${X(s.b).toFixed(1)},${y} `;
        prev = s;
      });
      return d ? `<path d="${d}" class="tline" style="stroke:${cols[zi]}"/>` : "";
    }).join("");
    const sel = this._tarSel(mid, segs);
    const hits = segs.map((s) => `<rect x="${X(s.a).toFixed(1)}" y="0" width="${Math.max(X(s.b) - X(s.a), 3).toFixed(1)}" height="${H - pb}" class="yhit${s.r.id === sel ? " on" : ""}" data-tar="${esc(s.r.id)}" data-tm="${esc(mid)}" tabindex="0" role="button" aria-label="${esc(s.r.name || s.r.valid_from)}"><title>${esc(s.r.name || "")} ${this.date(s.r.valid_from)}: ${zones.map((z) => this.num(Number(s.r.prices?.[z] || 0), 4)).join(" / ")}</title></rect>`).join("");
    const unit = `${this.settings.currency || ""}/${this.unit(mid)}`;
    return `<div class="chart card tchart" style="--mc:${this.color(mid)}"><div class="ctitle"><span class="dot" style="background:${this.color(mid)}"></span><b>${esc(tm.tc_title)} · ${esc(this.mName(mid))}</b><small class="muted">${esc(unit)}</small></div>
      <div class="tplot"><div class="tyax"><span>${this.num(hi - pad, 2)}</span><span>${this.num(lo + (lo > 0 ? pad : 0), 2)}</span></div>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img">${grid}${lines}${hits}</svg><div class="txax">${xl}</div></div>
      ${zones.length > 1 ? `<div class="legend">${zones.map((z, i) => `<span><i class="lg" style="background:${cols[i]}"></i>${esc(this.zName(mid, z))}</span>`).join("")}</div>` : ""}
      <div class="ydet tdet" data-tdet="${esc(mid)}">${this.tariffDetail(mid, sel)}</div></div>`;
  }

  _tarSel(mid, segs) {
    this._tarPick = this._tarPick || {};
    const ids = segs.map((s) => s.r.id);
    if (!ids.includes(this._tarPick[mid])) {
      const today = new Date().toISOString().slice(0, 10);
      const cur = [...segs].reverse().find((s) => String(s.r.valid_from) <= today);
      this._tarPick[mid] = (cur || segs[segs.length - 1]).r.id;
    }
    return this._tarPick[mid];
  }

  tariffDetail(mid, id) {
    const tm = this.tm, t = this.t;
    const rows = (this._data.tariffs || []).filter((r) => r.medium === mid && r.valid_from);
    const segs = this._tarSegs(mid, rows), i = segs.findIndex((s) => s.r.id === id), s = segs[i];
    if (!s) return `<p class="muted small">${esc(tm.tc_hint)}</p>`;
    const r = s.r, prev = segs[i - 1]?.r, first = segs[0].r, zones = this.zones(mid), cols = this._tarColors(mid);
    const pct = (a, b) => (Number(a) > 0 && Number(b) > 0 ? ((b - a) / a) * 100 : null);
    const chg = (p) => (p === null ? "" : `<small class="${p > 0 ? "neg" : "pos"}">${p > 0 ? "▲" : p < 0 ? "▼" : "="} ${this.num(Math.abs(p), 1)}%</small>`);
    const unit = `${this.settings.currency || ""}/${this.unit(mid)}`;
    const sup = (this._data.suppliers || []).find((x) => x.id === r.supplier_id);
    const to = s.open ? tm.tc_until : this.date(new Date((s.b - 1) * 864e5).toISOString().slice(0, 10));
    const days = Math.round(s.b - s.a);
    const zrows = zones.map((z, zi) => {
      const v = Number(r.prices?.[z]);
      if (!Number.isFinite(v)) return "";
      const pv = pct(Number(prev?.prices?.[z]), v), pf = i > 0 ? pct(Number(first.prices?.[z]), v) : null;
      return `<div><span>${zones.length > 1 ? `<i class="lg" style="background:${cols[zi]}"></i>${esc(this.zName(mid, z))}` : esc(unit)}</span><b>${this.num(v, 4)}</b>${prev ? chg(pv) : ""}${pf !== null && i > 1 ? `<small class="muted">${esc(tm.tc_first)}: ${pf > 0 ? "+" : ""}${this.num(pf, 1)}%</small>` : ""}</div>`;
    }).join("");
    const fx = Number(r.fixed_monthly);
    return `<div class="yhead"><button type="button" class="yarr" data-tstep="-1" data-tm="${esc(mid)}" ${i <= 0 ? "disabled" : ""}>‹</button><b>${esc(r.name || this.mName(mid))}</b><small class="muted">${this.date(r.valid_from)} – ${esc(to)} · ${esc(tm.tc_days.replace("{n}", days))}${s.open ? ` · ${esc(tm.tc_cur)}` : ""}</small><button type="button" class="yarr" data-tstep="1" data-tm="${esc(mid)}" ${i >= segs.length - 1 ? "disabled" : ""}>›</button></div>
      <div class="ystats">${zrows}${fx ? `<div><span>${esc(tm.tc_fixed)}</span><b>${this.money(fx)}</b>${prev && Number(prev.fixed_monthly) ? chg(pct(Number(prev.fixed_monthly), fx)) : ""}</div>` : ""}${sup ? `<div><span>${esc(tm.tc_sup)}</span><b class="small">${esc(sup.name)}</b></div>` : ""}</div>
      ${prev ? `<p class="muted small">${esc(tm.tc_vs)}: ${esc(prev.name || "")} (${this.date(prev.valid_from)})</p>` : ""}${r.note ? `<p class="small">${esc(r.note)}</p>` : ""}`;
  }

  _selectTariff(mid, id) {
    this._tarPick = this._tarPick || {};
    this._tarPick[mid] = id;
    const root = this.shadowRoot;
    root.querySelectorAll(`[data-tar][data-tm="${mid}"]`).forEach((el) => el.classList.toggle("on", el.dataset.tar === id));
    const box = [...root.querySelectorAll("[data-tdet]")].find((b) => b.dataset.tdet === mid);
    if (box) { box.innerHTML = this.tariffDetail(mid, id); this._bindTariffDetail(box); }
  }

  _bindTariffDetail(scope) {
    scope.querySelectorAll("[data-tstep]").forEach((b) => b.addEventListener("click", () => {
      const mid = b.dataset.tm;
      const segs = this._tarSegs(mid, (this._data.tariffs || []).filter((r) => r.medium === mid && r.valid_from));
      const i = segs.findIndex((s) => s.r.id === this._tarPick?.[mid]) + Number(b.dataset.tstep);
      if (i >= 0 && i < segs.length) this._selectTariff(mid, segs[i].r.id);
    }));
  }

  exportBtns() {
    const tm = this.tm;
    return `<span class="exp"><button class="small" data-exp="xlsx">⬇ ${esc(tm.export_x)}</button><button class="small" data-exp="csv">⬇ ${esc(tm.export_c)}</button></span>`;
  }

  async _download(url, fallback) {
    try {
      const r = await this._hass.fetchWithAuth(url);
      if (!r.ok) throw new Error(`${r.status}`);
      const cd = r.headers.get("Content-Disposition") || "";
      const name = (cd.match(/filename="([^"]+)"/) || [])[1] || fallback;
      const blob = await r.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (e) { this._msg = `${this.t.error}: ${e.message || e}`; this._render(); }
  }

  /* ---------- import ---------- */
  importable(col) { return Object.prototype.hasOwnProperty.call(IMP, col); }

  renderImport() {
    const t = this.t, tm = this.tm, d = this._imp, cols = IMP[d.col];
    const r = d.res;
    const errs = (r?.errors || []).slice(0, 8).map((e) => `<li>${esc(tm.imp_row.replace("{r}", e.row))}: ${esc(tm.imp_errs[e.error] || e.error)}${e.field ? ` (${esc(e.field)})` : ""}</li>`).join("");
    const res = !r ? "" : r.missing?.length ? `<div class="msg err">${esc(tm.imp_missing.replace("{c}", r.missing.join(", ")))}</div>`
      : `<div class="impres"><span class="pos">✓ ${esc(tm.imp_ok.replace("{n}", r.total))}</span>${r.duplicates ? `<span class="muted">${esc(tm.imp_dup.replace("{n}", r.duplicates))}</span>` : ""}${r.errors?.length ? `<span class="neg">${esc(tm.imp_err.replace("{n}", r.errors.length))}</span>` : ""}</div>
        ${errs ? `<ul class="imperr">${errs}</ul>` : ""}${r.new_suppliers?.length ? `<p class="muted small">${esc(tm.imp_sup.replace("{s}", r.new_suppliers.map((s) => s.name).join(", ")))}</p>` : ""}
        ${r.items?.length ? `<div class="tablewrap"><table class="imptab"><thead><tr>${Object.keys(r.columns).map((k) => `<th>${esc(k)}</th>`).join("")}</tr></thead><tbody>${r.items.slice(0, 5).map((it) => `<tr>${Object.keys(r.columns).map((k) => `<td>${esc(k === "medium" ? this.mName(it.medium) : k === "supplier" ? ((this._data.suppliers || []).find((s) => s.id === it.supplier_id) || (r.new_suppliers || []).find((s) => s.id === it.supplier_id) || {}).name || "" : k === "quantity" ? Object.values(it.quantities || {})[0] ?? "" : it[k] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}`;
    return `<div class="backdrop"><div class="dialog imp">
      <div class="dhead"><span class="grab"></span><h2>${esc(tm.import_t)} · ${esc(t.tabs[d.col])}</h2><button type="button" class="x" id="impx">✕</button></div>
      <div class="dbody"><p class="muted small">${esc(tm.imp_intro)}</p>
        <div class="tablewrap"><table class="impcols"><thead><tr><th>${esc(tm.imp_col)}</th><th>${esc(tm.imp_desc)}</th><th>${esc(tm.imp_ex)}</th></tr></thead>
        <tbody>${cols.map(([k, req, ex]) => `<tr><td>${req ? `<b>${esc(k)}</b>` : esc(k)}</td><td>${esc(tm.imp_cols[k] || "")}</td><td class="mono">${esc(ex)}</td></tr>`).join("")}</tbody></table></div>
        <div class="row tpl"><span class="muted small">${esc(tm.imp_tpl)}:</span><button type="button" class="small" data-tpl="xlsx">⬇ .xlsx</button><button type="button" class="small" data-tpl="csv">⬇ .csv</button></div>
        <label class="filebtn ${d.busy ? "dis" : ""}"><input type="file" id="impfile" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>📄 ${esc(d.file?.name || tm.imp_file)}</label>
        ${d.err ? `<div class="msg err">${esc(d.err)}</div>` : ""}${res}</div>
      <div class="actions"><span class="sp"></span><button type="button" id="impcancel">${esc(t.cancel)}</button>
        ${r && r.total && !r.missing?.length ? `<button type="button" class="primary" id="impsave" ${d.busy ? "disabled" : ""}>${esc(tm.imp_save.replace("{n}", r.total))}</button>` : `<button type="button" class="primary" id="impcheck" ${!d.file || d.busy ? "disabled" : ""}>${esc(tm.imp_check)}</button>`}</div></div></div>`;
  }

  async _impSend(commit) {
    const d = this._imp;
    d.busy = true; d.err = ""; this._render();
    try {
      const fd = new FormData();
      fd.append("collection", d.col);
      if (d.col === "investments" && this._proj && this._proj !== "__all") fd.append("project_id", this._proj);
      fd.append("commit", commit ? "1" : "0");
      fd.append("file", d.file, d.file.name);
      const r = await this._hass.fetchWithAuth("/api/utility_costs/import_table", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || r.status);
      if (commit) { this._imp = null; this._msg = this.tm.imp_done.replace("{n}", j.saved || 0); await this._load(); return; }
      d.res = j;
    } catch (e) { d.err = `${this.t.error}: ${e.message || e}`; }
    d.busy = false; this._render();
  }

  /* ---------- settings: notifications ---------- */
  tabsSection(w) {
    const tm = this.tm, hidden = w.hidden_tabs || [];
    const opt = ["investments", "invoices", "installments", "tariffs", "readings", "corrections", "suppliers"];
    return `<section class="card set"><div class="shead"><b>${esc(tm.tabs_h)}</b></div>
      <div class="tabchks">${opt.map((k) => `<label class="chk"><input type="checkbox" data-tabchk="${k}" ${hidden.includes(k) ? "" : "checked"}> ${esc(this.t.tabs[k])}</label>`).join("")}</div>
      <p class="muted small">${esc(tm.tabs_hint)}</p></section>`;
  }

  notifySection(w) {
    const tm = this.tm, n = w.notifications || {};
    const svcs = Object.keys(this._hass?.services?.notify || {}).map((s) => `notify.${s}`);
    return `<section class="card set"><div class="shead"><b>${esc(tm.n_h)}</b></div>
      <label class="chk"><input type="checkbox" data-nchk="enabled" ${n.enabled !== false ? "checked" : ""}> ${esc(tm.n_on)}</label>
      <div class="grid"><label class="half">${esc(tm.n_days)}<input type="number" min="0" data-num data-p="notifications.installment_days" value="${esc(n.installment_days ?? 3)}"></label>
      <label class="half">${esc(tm.n_dev)}<input type="number" min="1" data-num data-p="notifications.deviation_pct" value="${esc(n.deviation_pct ?? 10)}"></label>
      <label>${esc(tm.n_svc)}<input list="ucnotify" data-p="notifications.service" value="${esc(n.service || "")}" placeholder="notify.mobile_app_…"></label></div>
      <datalist id="ucnotify">${svcs.map((s) => `<option value="${esc(s)}"></option>`).join("")}</datalist>
      <p class="muted small">${esc(tm.n_hint)}</p></section>`;
  }

  /* ---------- investments: cached result info ---------- */
  roiMeta(r) {
    if (!r?._meta) return "";
    const at = r._meta.computed_at ? new Date(r._meta.computed_at).toLocaleString(this.locale, { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
    return `<div class="sumbar"><span class="muted" title="${esc(this.tm.roi_cached)}">${at ? `${esc(this.tm.roi_at)}: ${esc(at)}` : ""}</span>${this.admin ? `<button class="small" id="roirecalc" ${this._roiBusy ? "disabled" : ""}>${this._roiBusy ? esc(this.t.recalculating) : "⟳ " + esc(this.t.recalc)}</button>` : ""}</div>`;
  }

  _bindMore() {
    const root = this.shadowRoot, $ = (s) => root.querySelector(s);
    root.querySelectorAll("[data-tar]").forEach((el) => {
      const go = () => this._selectTariff(el.dataset.tm, el.dataset.tar);
      el.addEventListener("click", go);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      if (window.matchMedia("(hover: hover)").matches) el.addEventListener("mouseenter", go);
    });
    this._bindTariffDetail(root);
    root.querySelectorAll("[data-mon]").forEach((el) => {
      const go = () => this._selectMonth(el.dataset.mon);
      el.addEventListener("click", go);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      el.addEventListener("mouseenter", () => { if (window.matchMedia("(hover: hover)").matches) go(); });
    });
    this._bindMonthDetail();
    root.querySelectorAll("[data-exp]").forEach((b) => b.addEventListener("click", () => {
      const f = b.dataset.exp, y = Number(this._year);
      const sheet = this._tab === "summary" ? "summary" : this._tab;
      this._download(`/api/utility_costs/export?year=${y}&format=${f}${f === "csv" ? `&sheet=${sheet}` : ""}`, `utility_costs_${y}.${f}`);
    }));
    $("#impbtn")?.addEventListener("click", () => { this._imp = { col: this._tab }; this._render(); });
    const close = () => { this._imp = null; this._render(); };
    $("#impx")?.addEventListener("click", close);
    $("#impcancel")?.addEventListener("click", close);
    root.querySelectorAll("[data-tpl]").forEach((b) => b.addEventListener("click", () => this._imp && !b.closest("[data-w]") && this._download(`/api/utility_costs/import_template?collection=${this._imp.col}&format=${b.dataset.tpl}`, `import_${this._imp.col}.${b.dataset.tpl}`)));
    $("#impfile")?.addEventListener("change", (e) => { const f = e.target.files?.[0]; if (!f) return; this._imp.file = f; this._imp.res = null; this._impSend(false); });
    $("#impcheck")?.addEventListener("click", () => this._impSend(false));
    $("#impsave")?.addEventListener("click", () => this._impSend(true));
    $("#roirecalc")?.addEventListener("click", async () => { this._roiBusy = true; this._render(); await this._loadRoi(true); this._roiBusy = false; this._render(); });
    root.querySelectorAll("[data-tabchk]").forEach((c) => c.addEventListener("change", () => {
      const w = this._workSettings(), k = c.dataset.tabchk;
      w.hidden_tabs = (w.hidden_tabs || []).filter((x) => x !== k);
      if (!c.checked) w.hidden_tabs.push(k);
    }));
    root.querySelectorAll("[data-nchk]").forEach((c) => c.addEventListener("change", () => {
      const w = this._workSettings(); w.notifications = w.notifications || {}; w.notifications[c.dataset.nchk] = c.checked;
    }));
  }
};
