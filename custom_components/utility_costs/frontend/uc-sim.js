/* Utility Costs – what-if view of a project with a heat pump simulation rule.
 * The server returns, per month, values at 100 % share / 100 % COP / no losses
 * (base, base_cost, g100, gp100, e100, "ez:<zone>", tsum, tdays, tn, max_heat),
 * so the sliders here rescale them instantly without a round trip.
 */
const S = {"pl": {"cmp_group_sub": "średnio {b} kWh/dobę (±{sd}) przed przejściem", "cmp_h": "Prąd klimatyzatorów: licznik domu a model", "cmp_meter": "Z licznika domu", "cmp_meter_sub": "{d} dni · nadwyżka ponad średnio {b} kWh/dobę (±{sd}) przed przejściem", "cmp_model": "Z modelu COP", "cmp_model_sub": "ciepło przejęte od pieca ÷ COP przy temperaturze dnia", "cmp_run": "Godziny w trybie grzania", "cmp_run_sub": "średnio {h} h na dobę (suma wszystkich klimatyzatorów)", "cmp_ratio": "Licznik pokazuje {p}% tego, co zakłada model. Wynik oszczędności liczy prąd z licznika.", "meas": "pomiar", "meas_days": "pomiar {n} dni", "l_meas": "pomiar (klimatyzatory naprawdę grzeją)", "meas_part": "w tym zmierzone: {v} · faktyczny udział {p}%", "meas_note": "pomiar: gaz bez klimatyzacji z modelu stopniodni minus gaz faktycznie spalony; % = faktyczny udział klimatyzatorów", "sliders_sim": "Od {d} wynik jest mierzony – suwaki zmieniają tylko miesiące symulowane (przed tą datą).", "season": "Sezon", "base": "Ogrzewanie gazem (dziś)", "after": "Z klimatyzacją: gaz + prąd", "save": "Oszczędność", "of_heating": "kosztu ogrzewania", "el": "Prąd dla klimatyzatorów", "ctrl": "Symulacja", "share": "Udział klimatyzatorów w ogrzewaniu", "share_hint": "Resztę ciepła daje piec. Ciepła woda zostaje na gazie.", "cheap": "Prąd w tańszej strefie ({z})", "cheap_hint": "Np. ok. 90%, gdy magazyn energii ładuje się w nocy; ok. 58% przy G12W bez magazynu.", "loss": "Dodatkowe straty prądu", "loss_hint": "Np. 6% na ładowanie i rozładowanie magazynu.", "cop": "Sprawność klimatyzatorów względem katalogu", "cop_hint": "100% = krzywa COP z SCOP urządzeń. Mniej = szron, wiatr, wysoka nastawa.", "eff": "Sprawność pieca gazowego", "eff_hint": "Wyższa sprawność = więcej ciepła z m³, więc klimatyzatory muszą dać go więcej.", "reset": "Przywróć z projektu", "store": "Zapisz w projekcie", "stored": "Zapisano ustawienia symulacji – wynik przeliczony", "chart": "Gaz i prąd miesiąc po miesiącu", "l_gas": "Gaz", "l_el": "Prąd", "l_base": "Dziś: wszystko gazem", "bar_top": "liczba nad słupkiem = oszczędność", "month": "Miesiąc", "temp": "Temp.", "gas_now": "Gaz dziś", "gas_after": "Gaz po", "el_kwh": "Prąd kWh", "el_cost": "Prąd", "total": "Razem", "devices": "Klimatyzatory", "dev_total": "Razem moc grzewcza", "down_to": "pracuje do {t} °C", "coldest": "Najzimniejsza doba sezonu: klimatyzatory dają średnio ok. {kw} kW.", "enough": "Moc wystarcza z zapasem – ograniczeniem jest raczej to, do których pomieszczeń dociera ciepło.", "short": "To blisko mocy urządzeń – w mrozy część ciepła zostanie na piecu.", "est": "miesiąc szacowany (brak danych gazu na ogrzewanie)", "tn": "temperatura typowa (brak odczytu czujnika)", "fixed": "Porównanie dotyczy tylko ogrzewania: opłata stała i gaz na ciepłą wodę zostają bez zmian.", "no_data": "Brak danych do symulacji – sprawdź licznik gazu na ogrzewanie w regule projektu."}, "en": {"cmp_group_sub": "average {b} kWh/day (±{sd}) before the switch", "cmp_h": "Pump electricity: house meter vs. model", "cmp_meter": "From the house meter", "cmp_meter_sub": "{d} days · above an average of {b} kWh/day (±{sd}) before the switch", "cmp_model": "From the COP model", "cmp_model_sub": "heat taken over from the boiler ÷ COP at the day's temperature", "cmp_run": "Hours in heating mode", "cmp_run_sub": "on average {h} h per day (all units together)", "cmp_ratio": "The meter shows {p}% of what the model expects. The saving uses the meter.", "meas": "measured", "meas_days": "measured {n} days", "l_meas": "measured (pumps really heat)", "meas_part": "incl. measured: {v} · real share {p}%", "meas_note": "measured: gas without pumps from the degree-day model minus gas actually burnt; % = real share of the pumps", "sliders_sim": "From {d} the result is measured – the sliders only change the simulated months (before that date).", "season": "Season", "base": "Heating with gas (today)", "after": "With heat pumps: gas + electricity", "save": "Saving", "of_heating": "of heating cost", "el": "Electricity for the pumps", "ctrl": "Simulation", "share": "Share of heating from the pumps", "share_hint": "The boiler gives the rest. Hot water stays on gas.", "cheap": "Electricity in the cheaper zone ({z})", "cheap_hint": "E.g. about 90% when a home battery charges at night.", "loss": "Extra electricity losses", "loss_hint": "E.g. 6% for charging and discharging a battery.", "cop": "Pump efficiency vs. catalogue", "cop_hint": "100% = COP curve from the devices' SCOP. Less = frost, wind, high set point.", "eff": "Gas boiler efficiency", "eff_hint": "Higher efficiency = more heat per unit of gas, so the pumps must give more.", "reset": "Reset to project", "store": "Save to project", "stored": "Simulation settings saved – result recalculated", "chart": "Gas and electricity month by month", "l_gas": "Gas", "l_el": "Electricity", "l_base": "Today: all gas", "bar_top": "number above a bar = saving", "month": "Month", "temp": "Temp.", "gas_now": "Gas today", "gas_after": "Gas after", "el_kwh": "Electricity kWh", "el_cost": "Electricity", "total": "Total", "devices": "Devices", "dev_total": "Total heat output", "down_to": "works down to {t} °C", "coldest": "Coldest day of the season: the pumps give about {kw} kW on average.", "enough": "Plenty of power – the limit is rather which rooms the heat reaches.", "short": "Close to the devices' power – in frost part of the heat stays on the boiler.", "est": "estimated month (no heating gas data)", "tn": "typical temperature (no sensor reading)", "fixed": "Only heating is compared: the fixed fee and gas for hot water stay the same.", "no_data": "No data to simulate – check the heating gas meter in the project rule."}, "de": {"cmp_group_sub": "im Mittel {b} kWh/Tag (±{sd}) vor dem Umstieg", "cmp_h": "Pumpenstrom: Hauszähler vs. Modell", "cmp_meter": "Aus dem Hauszähler", "cmp_meter_sub": "{d} Tage · über dem Durchschnitt von {b} kWh/Tag (±{sd}) vor dem Umstieg", "cmp_model": "Aus dem COP-Modell", "cmp_model_sub": "vom Kessel übernommene Wärme ÷ COP bei der Tagestemperatur", "cmp_run": "Stunden im Heizmodus", "cmp_run_sub": "im Mittel {h} h pro Tag (alle Geräte)", "cmp_ratio": "Der Zähler zeigt {p} % dessen, was das Modell erwartet. Die Ersparnis nutzt den Zähler.", "meas": "gemessen", "meas_days": "{n} Tage gemessen", "l_meas": "gemessen (Pumpen heizen wirklich)", "meas_part": "davon gemessen: {v} · echter Anteil {p} %", "meas_note": "gemessen: Gas ohne Pumpen aus dem Gradtagsmodell minus tatsächlich verbranntes Gas; % = echter Anteil der Pumpen", "sliders_sim": "Ab {d} wird gemessen – die Regler ändern nur die simulierten Monate (davor).", "season": "Saison", "base": "Heizen mit Gas (heute)", "after": "Mit Wärmepumpen: Gas + Strom", "save": "Ersparnis", "of_heating": "der Heizkosten", "el": "Strom für die Pumpen", "ctrl": "Simulation", "share": "Anteil der Pumpen an der Heizung", "share_hint": "Den Rest liefert der Kessel. Warmwasser bleibt auf Gas.", "cheap": "Strom in der günstigeren Zone ({z})", "cheap_hint": "Z. B. etwa 90 %, wenn ein Heimspeicher nachts lädt.", "loss": "Zusätzliche Stromverluste", "loss_hint": "Z. B. 6 % für Laden und Entladen eines Speichers.", "cop": "Pumpen-Wirkungsgrad ggü. Katalog", "cop_hint": "100 % = COP-Kurve aus dem SCOP der Geräte. Weniger = Reif, Wind, hohe Solltemperatur.", "eff": "Wirkungsgrad des Gaskessels", "eff_hint": "Höherer Wirkungsgrad = mehr Wärme pro Gaseinheit, also müssen die Pumpen mehr liefern.", "reset": "Aus Projekt zurücksetzen", "store": "Im Projekt speichern", "stored": "Simulationseinstellungen gespeichert – neu berechnet", "chart": "Gas und Strom Monat für Monat", "l_gas": "Gas", "l_el": "Strom", "l_base": "Heute: alles mit Gas", "bar_top": "Zahl über dem Balken = Ersparnis", "month": "Monat", "temp": "Temp.", "gas_now": "Gas heute", "gas_after": "Gas danach", "el_kwh": "Strom kWh", "el_cost": "Strom", "total": "Summe", "devices": "Geräte", "dev_total": "Heizleistung gesamt", "down_to": "arbeitet bis {t} °C", "coldest": "Kältester Tag der Saison: die Pumpen liefern im Mittel etwa {kw} kW.", "enough": "Leistung reicht – begrenzend ist eher, welche Räume die Wärme erreicht.", "short": "Nahe an der Geräteleistung – bei Frost bleibt ein Teil der Wärme beim Kessel.", "est": "geschätzter Monat (keine Heizgas-Daten)", "tn": "typische Temperatur (kein Sensorwert)", "fixed": "Verglichen wird nur die Heizung: Grundgebühr und Gas für Warmwasser bleiben gleich.", "no_data": "Keine Daten für die Simulation – Heizgaszähler in der Projektregel prüfen."}};
export const makeSim = ({ esc }) => class {
  get ts() { const l = (this.locale || "en").split("-")[0]; return S[l] || S.en; }
  simRule(p) { return (p?.rules || []).find((r) => r.type === "heatpump"); }

  _simState(p, ru) {
    if (!this._sim || this._sim.pid !== p.id || this._sim.rid !== ru.id) {
      const zones = this._simZones(ru);
      this._sim = {
        pid: p.id, rid: ru.id, season: null,
        share: Number(ru.share_pct ?? 85), cop: Number(ru.cop_pct ?? 100), eff: Number(ru.boiler_eff_pct ?? 90),
        loss: Number(ru.losses_pct ?? 0), cheap: zones.cheap ? Number((ru.el_zones || {})[zones.cheap] ?? 50) : 100,
      };
    }
    return this._sim;
  }

  /* zones of the pump electricity and the cheaper one (by average price) */
  _simZones(ru) {
    const months = this._roi?.[this._proj]?.months || [];
    const sum = {};
    let e = 0;
    months.forEach((m) => { const v = m.rules?.[ru.id]; if (!v) return; e += v.e100 || 0; Object.keys(v).filter((k) => k.startsWith("ez:")).forEach((k) => { sum[k.slice(3)] = (sum[k.slice(3)] || 0) + v[k]; }); });
    const zones = Object.keys(sum);
    if (zones.length !== 2 || !e) return { zones, cheap: null, dear: null };
    const [a, b] = zones.sort((x, y) => sum[x] - sum[y]);
    return { zones, cheap: a, dear: b };
  }

  _simSeasons(r, ru) {
    const by = {};
    (r.months || []).forEach((m) => {
      const v = m.rules?.[ru.id]; if (!v || !v.tdays) return;
      const y = Number(m.month.slice(0, 4)), mo = Number(m.month.slice(5, 7));
      const s = mo >= 9 ? y : y - 1;
      (by[s] = by[s] || []).push(m);
    });
    return by;
  }

  _simCalc(months, ru, st, zinfo) {
    const k = (st.share / 100) * (st.eff / Number(ru.boiler_eff_pct || 90)) / Math.max(st.cop / 100, 0.01) * (1 + st.loss / 100);
    const fr = (v) => {
      if (zinfo.cheap) return st.cheap / 100 * (v[`ez:${zinfo.cheap}`] || 0) + (1 - st.cheap / 100) * (v[`ez:${zinfo.dear}`] || 0);
      const zs = Object.keys(v).filter((x) => x.startsWith("ez:"));
      if (zs.length === 1) return v[zs[0]];
      const w = ru.el_zones || {}, tot = zs.reduce((a, x) => a + Number(w[x.slice(3)] || 0), 0);
      return tot ? zs.reduce((a, x) => a + v[x] * Number(w[x.slice(3)] || 0) / tot, 0) : zs.reduce((a, x) => a + v[x], 0) / (zs.length || 1);
    };
    const rows = months.map((m) => {
      const v = m.rules[ru.id];
      const gasSaved = (v.gp100 || 0) * st.share / 100;
      const simElCost = fr(v) * k, simEl = (v.e100 || 0) * k;
      const simBase = v.base_cost || 0;
      const base = simBase + (v.m_base_cost || 0);
      const rest = simBase - gasSaved + (v.m_actual_cost || 0);
      const el = simEl + (v.m_el || 0), elCost = simElCost + (v.m_el_cost || 0);
      const mSave = (v.m_base_cost || 0) - (v.m_actual_cost || 0) - (v.m_el_cost || 0);
      return { month: m.month, temp: v.tdays ? v.tsum / v.tdays : null, tn: v.tn > 0, est: v.est_days > 0,
        raw: v, mDays: v.m_days || 0, days: v.tdays || 0, meterDays: v.m_meter_days || 0, mElModel: v.m_el_model || 0, mElModelCost: v.m_el_model_cost || 0, runH: v.m_run_h || 0, mEl: v.m_el || 0, mElCost: v.m_el_cost || 0, mBase: v.m_base || 0, mActual: v.m_actual || 0, mSave,
        baseQty: (v.base || 0) + (v.m_base || 0), base, gasQty: (v.base || 0) - (v.g100 || 0) * st.share / 100 + (v.m_actual || 0), rest, el, elCost,
        after: rest + elCost, save: base - rest - elCost, maxHeat: Math.max((v.max_heat || 0) * st.share / 100, v.max_mheat || 0) };
    });
    const tot = rows.reduce((a, x) => { ["baseQty", "base", "gasQty", "rest", "el", "elCost", "after", "save", "mDays", "mBase", "mActual", "mSave", "meterDays", "mElModel", "mElModelCost", "runH", "mEl", "mElCost"].forEach((f) => { a[f] = (a[f] || 0) + x[f]; }); a.maxHeat = Math.max(a.maxHeat || 0, x.maxHeat); return a; }, {});
    return { rows, tot };
  }

  simView(p, r) {
    const t = this.t, s = this.ts, ru = this.simRule(p), cur = esc(this.settings.currency || "");
    const st = this._simState(p, ru), zinfo = this._simZones(ru);
    const seasons = this._simSeasons(r, ru), keys = Object.keys(seasons).map(Number).sort();
    if (!keys.length) return `<div class="card empty">${esc(s.no_data)}</div>`;
    if (!keys.includes(st.season)) {
      const full = keys.filter((y) => seasons[y].some((m) => m.month.endsWith("-01")));
      st.season = (full.length ? full : keys).slice(-1)[0];
    }
    const nowY = new Date(), curSeason = nowY.getMonth() >= 8 ? nowY.getFullYear() : nowY.getFullYear() - 1;
    const chips = `<div class="pchips simseason">${keys.map((y) => `<button class="pchip ${y === st.season ? "on" : ""}" data-simseason="${y}">${s.season} ${y}/${String((y + 1) % 100).padStart(2, "0")}${y === curSeason ? ` <small>(${esc(t.yd_partial)})</small>` : ""}</button>`).join("")}</div>`;
    const range = (key, min, max, step, label, hint, fmt) => `<label class="simr"><span><span>${esc(label)}</span><b data-simv="${key}">${fmt(st[key])}</b></span>
      <input type="range" min="${min}" max="${max}" step="${step}" value="${st[key]}" data-sim="${key}">${hint ? `<small class="muted">${esc(hint)}</small>` : ""}</label>`;
    const pct = (v) => `${this.num(v, 0)}%`;
    const ctrls = `<div class="card simctl"><h3>${esc(s.ctrl)}</h3>
      ${range("share", 0, 100, 5, s.share, s.share_hint, pct)}
      ${zinfo.cheap ? range("cheap", 0, 100, 5, s.cheap.replace("{z}", this.zName(ru.el_medium, zinfo.cheap) || zinfo.cheap), s.cheap_hint, pct) : ""}
      ${range("loss", 0, 20, 1, s.loss, s.loss_hint, pct)}
      ${range("cop", 50, 120, 5, s.cop, s.cop_hint, pct)}
      ${range("eff", 70, 100, 1, s.eff, s.eff_hint, pct)}
      ${ru.switch_date ? `<p class="muted small">ⓘ ${esc(s.sliders_sim.replace("{d}", this.date(ru.switch_date)))}</p>` : ""}
      <div class="simbtn"><button type="button" class="small" id="simreset">${esc(s.reset)}</button>${this.admin ? `<button type="button" class="small primary" id="simstore">${esc(s.store)}</button>` : ""}</div></div>`;
    const devs = (ru.devices || []), kw = devs.reduce((a, d) => a + Number(d.kw || 0), 0);
    const devCard = `<div class="card simdev"><h3>${esc(s.devices)}</h3>${devs.map((d) => `<div class="rrow"><span class="rlbl"><span>${esc(d.name || "—")}</span><small>SCOP ${this.num(d.scop ?? 4.2, 1)} · ${esc(s.down_to.replace("{t}", this.num(d.min_temp ?? -15, 0)))}</small></span><b>${this.num(d.kw, 2)} kW</b></div>`).join("")}
      <div class="rrow tot"><span class="rlbl"><span>${esc(s.dev_total)}</span></span><b>${this.num(kw, 2)} kW</b></div>
      <p class="muted small" data-simcold></p></div>`;
    const res = this._simResults(p, r, ru, st, zinfo, seasons[st.season], kw);
    return `${chips}<div class="simres" data-simk>${res.kpis}</div>
      <div class="simgrid simtop">${ctrls}<div data-simc>${res.bars}</div></div>
      <div data-simt>${res.table}</div>
      <div class="simgrid">${devCard}</div>
      ${p.note ? `<div class="card simnote"><p class="small">${esc(p.note)}</p></div>` : ""}
      <p class="muted small">ⓘ ${esc(s.fixed)}</p>`;
  }

  _simResults(p, r, ru, st, zinfo, months, kw) {
    const t = this.t, s = this.ts, cur = esc(this.settings.currency || "");
    const { rows, tot } = this._simCalc(months, ru, st, zinfo);
    const pctSave = tot.base ? tot.save / tot.base * 100 : 0;
    const kpis = `<div class="kpis">
      <div class="kpi" style="border-top-color:${this.color(ru.medium)}"><span>${esc(s.base)}</span><b>${this.money(tot.base)}</b><small>${this.num(tot.baseQty, 0)} ${esc(this.unit(ru.medium))} · ${cur}</small></div>
      <div class="kpi"><span>${esc(s.after)}</span><b>${this.money(tot.after)}</b><small>${esc(s.l_gas)} ${this.money(tot.rest)} + ${esc(s.l_el)} ${this.money(tot.elCost)}</small></div>
      <div class="kpi" style="border-top-color:var(--success-color,#4FB477)"><span>${esc(s.save)}</span><b class="${tot.save < 0 ? "neg" : "pos"}">${this.money(tot.save)}</b><small>${this.num(pctSave, 0)}% ${esc(s.of_heating)}${tot.mDays ? `<br>${esc(s.meas_part.replace("{v}", this.money(tot.mSave)).replace("{p}", this.num(tot.mBase ? (tot.mBase - tot.mActual) / tot.mBase * 100 : 0, 0)))}` : ""}</small></div>
      <div class="kpi" style="border-top-color:${this.color(ru.el_medium)}"><span>${esc(s.el)}</span><b>${this.num(tot.el, 0)}</b><small>kWh · ${this.money(tot.elCost)} ${cur}</small></div></div>`;
    const mx = Math.max(...rows.map((x) => Math.max(x.base, x.after)), 1);
    const H = window.innerWidth < 860 ? 170 : 330;
    const bars = `<div class="card simchart"><h3>${esc(s.chart)}</h3><div class="sbars">${rows.map((x) => {
      const hg = Math.max(0, x.rest) / mx * H, he = x.elCost / mx * H, hb = x.base / mx * H;
      const lbl = new Date(x.month + "-01T00:00:00").toLocaleDateString(this.locale, { month: "short" });
      return `<div class="sb${x.mDays ? (x.mDays >= x.days ? " meas" : " meas part") : ""}" title="${esc(this.monthName(x.month))}\n${esc(s.l_base)}: ${this.money(x.base)}\n${esc(s.l_gas)}: ${this.money(x.rest)}\n${esc(s.l_el)}: ${this.money(x.elCost)} (${this.num(x.el, 0)} kWh)\n${esc(s.save)}: ${this.money(x.save)}">
        <span class="sv ${x.save < 0 ? "neg" : ""}">${x.save ? this.num(x.save, 0) : ""}</span>
        <div class="sstack" style="height:${H}px"><i class="sbase" style="bottom:${hb}px"></i><i class="sgas" style="height:${hg}px;background:${this.color(ru.medium)}"></i><i class="sel" style="height:${he}px;background:${this.color(ru.el_medium)}"></i></div>
        <span class="sl">${esc(lbl)}${x.est ? "≈" : ""}${x.mDays ? "●" : ""}</span></div>`;
    }).join("")}</div>
      <div class="slegend"><span><i style="background:${this.color(ru.medium)}"></i>${esc(s.l_gas)}</span><span><i style="background:${this.color(ru.el_medium)}"></i>${esc(s.l_el)}</span><span><i class="dash"></i>${esc(s.l_base)}</span>${rows.some((x) => x.mDays) ? `<span>● ${esc(s.l_meas)}</span>` : ""}<span class="muted">${esc(s.bar_top)}</span></div></div>`;
    const table = `<div class="tablewrap"><table class="simtab"><thead><tr><th>${esc(s.month)}</th><th class="r">${esc(s.temp)}</th><th class="r">${esc(s.gas_now)}</th><th class="r">${esc(s.gas_after)}</th><th class="r">${esc(s.el_kwh)}</th><th class="r">${esc(s.el_cost)}</th><th class="r">${esc(s.save)}</th></tr></thead><tbody>
      ${rows.map((x) => `<tr class="${x.mDays ? "measrow" : ""}"><td>${esc(this.monthName(x.month))}${x.est ? " ≈" : ""}${x.mDays ? ` <span class="mtag">● ${esc(x.mDays >= x.days ? s.meas : s.meas_days.replace("{n}", this.num(x.mDays, 0)))}${x.mBase ? ` · ${this.num((x.mBase - x.mActual) / x.mBase * 100, 0)}%` : ""}</span>` : ""}</td><td class="r muted">${x.temp === null ? "" : `${this.num(x.temp, 1)} °C${x.tn ? "*" : ""}`}</td><td class="r">${this.money(x.base)}</td><td class="r">${this.money(x.rest)}</td><td class="r muted">${this.num(x.el, 0)}</td><td class="r">${this.money(x.elCost)}</td><td class="r ${x.save < 0 ? "neg" : "pos"}">${this.money(x.save)}</td></tr>`).join("")}
      <tr class="foot"><td>${esc(s.total)}</td><td></td><td class="r">${this.money(tot.base)}</td><td class="r">${this.money(tot.rest)}</td><td class="r">${this.num(tot.el, 0)}</td><td class="r">${this.money(tot.elCost)}</td><td class="r ${tot.save < 0 ? "neg" : "pos"}">${this.money(tot.save)}</td></tr></tbody></table></div>
      <p class="muted small">${rows.some((x) => x.mDays) ? `● ${esc(s.meas_note)} ` : ""}${rows.some((x) => x.est) ? `≈ ${esc(s.est)} ` : ""}${rows.some((x) => x.tn) ? `* ${esc(s.tn)}` : ""}</p>`;
    this._simCold = { kw: tot.maxHeat / 24, total: kw };
    const m = (r.models || {})[ru.id] || {};
    const cmp = tot.meterDays ? `<div class="card simcmp"><h3>${esc(s.cmp_h)}</h3>
      <div class="rrow"><span class="rlbl"><span>${esc(s.cmp_meter)}</span><small>${esc(s.cmp_meter_sub.replace("{d}", this.num(tot.meterDays, 0)).replace("{b}", this.num(m.el_base || 0, 1)).replace("{sd}", this.num(m.el_base_sd || 0, 1)))}</small></span><b>${this.num(tot.mEl, 0)} kWh · ${this.money(tot.mElCost)}</b></div>
      ${(ru.el_meters || []).length > 1 ? (ru.el_meters || []).map((g, gi) => { const kwh = rows.reduce((acc, x) => acc + (x.raw[`m_el_g${gi}`] || 0), 0); const b0 = (m.groups || [])[gi] || {}; return `<div class="rrow sub"><span class="rlbl"><span>· ${esc(g.name || `#${gi + 1}`)}</span><small>${esc(s.cmp_group_sub.replace("{b}", this.num(b0.el_base || 0, 1)).replace("{sd}", this.num(b0.el_base_sd || 0, 1)))}</small></span><b>${this.num(kwh, 0)} kWh</b></div>`; }).join("") : ""}
      <div class="rrow"><span class="rlbl"><span>${esc(s.cmp_model)}</span><small>${esc(s.cmp_model_sub)}</small></span><b>${this.num(tot.mElModel, 0)} kWh · ${this.money(tot.mElModelCost)}</b></div>
      ${tot.runH ? `<div class="rrow"><span class="rlbl"><span>${esc(s.cmp_run)}</span><small>${esc(s.cmp_run_sub.replace("{h}", this.num(tot.runH / Math.max(tot.mDays, 1), 1)))}</small></span><b>${this.num(tot.runH, 0)} h</b></div>` : ""}
      <p class="muted small">${esc(tot.mElModel ? s.cmp_ratio.replace("{p}", this.num(tot.mEl / tot.mElModel * 100, 0)) : "")}</p></div>` : "";
    return { kpis, bars, table: table + cmp };
  }

  _simRefresh() {
    const p = this._curProj(), r = this._roi?.[this._proj], ru = this.simRule(p);
    if (!p || !r || !ru) return;
    const st = this._sim, zinfo = this._simZones(ru), seasons = this._simSeasons(r, ru);
    const kw = (ru.devices || []).reduce((a, d) => a + Number(d.kw || 0), 0);
    const res = this._simResults(p, r, ru, st, zinfo, seasons[st.season] || [], kw), root = this.shadowRoot;
    [["[data-simk]", res.kpis], ["[data-simc]", res.bars], ["[data-simt]", res.table]].forEach(([q, h]) => { const el = root.querySelector(q); if (el) el.innerHTML = h; });
    this._simColdText();
  }

  _simColdText() {
    const el = this.shadowRoot.querySelector("[data-simcold]"), c = this._simCold, s = this.ts;
    if (!el || !c) return;
    el.textContent = `${s.coldest.replace("{kw}", this.num(c.kw, 1))} ${c.kw <= c.total * 0.8 ? s.enough : s.short}`;
  }

  _bindSim() {
    const root = this.shadowRoot, $ = (q) => root.querySelector(q);
    const p = this._curProj(), ru = this.simRule(p);
    if (!ru || !this._sim) return;
    this._simColdText();
    root.querySelectorAll("[data-simseason]").forEach((b) => b.addEventListener("click", () => {
      this._sim.season = Number(b.dataset.simseason);
      root.querySelectorAll("[data-simseason]").forEach((x) => x.classList.toggle("on", x === b));
      this._simRefresh();
    }));
    root.querySelectorAll("[data-sim]").forEach((inp) => inp.addEventListener("input", () => {
      this._sim[inp.dataset.sim] = Number(inp.value);
      const v = root.querySelector(`[data-simv="${inp.dataset.sim}"]`); if (v) v.textContent = `${this.num(Number(inp.value), 0)}%`;
      this._simRefresh();
    }));
    $("#simreset")?.addEventListener("click", () => { this._sim = null; this._render(); });
    $("#simstore")?.addEventListener("click", async () => {
      const proj = JSON.parse(JSON.stringify(this.projects.find((x) => x.id === p.id)));
      const rule = proj.rules.find((x) => x.id === ru.id), st = this._sim, z = this._simZones(ru);
      Object.assign(rule, { share_pct: st.share, cop_pct: st.cop, boiler_eff_pct: st.eff, losses_pct: st.loss });
      if (z.cheap) rule.el_zones = { [z.cheap]: st.cheap, [z.dear]: 100 - st.cheap };
      try {
        await this.ws({ type: "save", collection: "projects", item: proj });
        this._msg = this.ts.stored; this._sim = null;
        await this._load(); await this._loadRoi(); this._render();
      } catch (e) { this._msg = `${this.t.error}: ${e.message || e}`; this._render(); }
    });
  }
};
