/* Utility Costs – panel styles */
export const CSS = `
:host { display:block; min-height:100vh; background: var(--primary-background-color); color: var(--primary-text-color); font-family: var(--ha-font-family-body, Roboto, sans-serif); -webkit-tap-highlight-color: transparent; }
.toolbar { position:sticky; top:0; z-index:3; display:flex; align-items:center; height:56px; padding:0 8px; background: var(--app-header-background-color, var(--primary-color)); color: var(--app-header-text-color, #fff); }
.title { font-size:20px; margin-left:4px; font-weight:400; }
.tabs { position:sticky; top:56px; z-index:2; display:flex; gap:6px; overflow-x:auto; padding:10px 16px; background: var(--primary-background-color); border-bottom:1px solid var(--divider-color); scrollbar-width:none; }
.tabs::-webkit-scrollbar { display:none; }
.tab { flex:0 0 auto; background: var(--card-background-color); border:1px solid var(--divider-color); color: var(--secondary-text-color); padding:7px 14px; font-size:14px; cursor:pointer; border-radius:18px; white-space:nowrap; }
.tab.on { color: var(--text-primary-color, #fff); background: var(--primary-color); border-color: var(--primary-color); }
.content { padding:16px; max-width:1200px; margin:0 auto; box-sizing:border-box; padding-bottom:96px; }
.filters { display:flex; flex-wrap:wrap; gap:12px; align-items:flex-end; margin-bottom:16px; }
.filters label { min-width:120px; }
select, input, textarea { background: var(--card-background-color); color: var(--primary-text-color); border:1px solid var(--divider-color); border-radius:8px; padding:9px 10px; font:inherit; font-size:15px; box-sizing:border-box; min-height:40px; }
select:focus, input:focus, textarea:focus { outline:2px solid var(--primary-color); outline-offset:-1px; }
textarea { width:100%; font-family: monospace; }
button { background: var(--card-background-color); color: var(--primary-text-color); border:1px solid var(--divider-color); border-radius:8px; padding:9px 16px; cursor:pointer; font:inherit; font-size:14px; min-height:40px; }
button.primary { background: var(--primary-color); color: var(--text-primary-color, #fff); border-color: var(--primary-color); }
button.link { background:none; border:none; color: var(--primary-color); padding:4px 8px; min-height:0; }
button.danger { color: var(--error-color, #db4437); }
.tablewrap { overflow-x:auto; background: var(--card-background-color); border-radius: var(--ha-card-border-radius, 12px); border:1px solid var(--divider-color); box-shadow: var(--ha-card-box-shadow, none); }
table { width:100%; border-collapse:collapse; font-size:14px; }
th, td { padding:10px 12px; border-bottom:1px solid var(--divider-color); text-align:left; vertical-align:top; }
tbody tr:hover td { background: var(--secondary-background-color); }
th { color: var(--secondary-text-color); font-weight:500; white-space:nowrap; font-size:13px; }
td.r, th.r { text-align:right; white-space:nowrap; font-variant-numeric: tabular-nums; }
td.act { white-space:nowrap; text-align:right; }
tr.foot td { font-weight:500; background: var(--secondary-background-color); }
.b { font-weight:600; }
.muted { color: var(--secondary-text-color); }
.warn { color: var(--error-color, #E0643A); font-weight:600; }
.neg { color: var(--error-color, #E0643A); }
.pos { color: var(--success-color, #4FB477); }
.dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:6px; vertical-align:middle; }
.bar { display:flex; height:4px; margin-top:4px; background: var(--divider-color); border-radius:2px; overflow:hidden; }
.bar.big { height:8px; border-radius:4px; margin:8px 0; }
.bar span { display:block; height:100%; }
.msg { padding:10px 14px; margin-bottom:12px; border-radius:8px; background: var(--secondary-background-color); }
h3 { margin:24px 0 10px; font-weight:500; font-size:16px; }
label { display:flex; flex-direction:column; gap:4px; font-size:13px; color: var(--secondary-text-color); }
label.block { margin:8px 0; }
label.chk { flex-direction:row; align-items:center; gap:8px; min-height:40px; }
label.chk input { width:20px; height:20px; min-height:0; }
.kpis { display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:16px; }
.kpi { background: var(--card-background-color); border:1px solid var(--divider-color); border-top:3px solid var(--primary-color); border-radius:12px; padding:12px 14px; display:flex; flex-direction:column; gap:2px; }
.kpi span { color: var(--secondary-text-color); font-size:13px; }
.kpi b { font-size:22px; font-weight:500; font-variant-numeric: tabular-nums; }
.kpi small { color: var(--secondary-text-color); font-size:12px; }
.cards { display:none; flex-direction:column; gap:10px; }
.card { background: var(--card-background-color); border:1px solid var(--divider-color); border-radius:12px; padding:12px 14px; }
.card[data-edit] { cursor:pointer; }
.card[data-edit]:active { background: var(--secondary-background-color); }
.chead { display:flex; justify-content:space-between; align-items:center; gap:8px; font-weight:500; font-size:15px; }
.camt { font-weight:600; font-variant-numeric: tabular-nums; white-space:nowrap; }
.card dl { display:grid; grid-template-columns: auto 1fr; gap:4px 12px; margin:8px 0 0; font-size:13px; }
.card dt { color: var(--secondary-text-color); }
.card dd { margin:0; text-align:right; }
.chips { display:flex; flex-wrap:wrap; gap:6px; }
.chip { background: var(--secondary-background-color); border-radius:14px; padding:4px 10px; font-size:13px; }
.ystep { display:flex; align-items:center; gap:4px; }
.ystep select { width:96px; min-width:0; flex:0 0 auto; }
button.yarr { min-width:40px; width:40px; padding:0; font-size:20px; line-height:1; margin:0; flex:0 0 auto; }
/* one control height everywhere controls sit side by side */
.filters select, .filters button, .sumbar button, .exp button, .attact button, .attact .filebtn, .actions button, .tpl button, .row button {
  height:40px; min-height:40px; box-sizing:border-box; margin-top:0; padding-top:0; padding-bottom:0; font-size:14px; line-height:1; display:inline-flex; align-items:center; justify-content:center; gap:6px; }
.filters select { font-size:15px; display:block; }
.grid input:not([type=checkbox]):not([type=radio]), .grid select, .zones input { height:42px; min-height:42px; box-sizing:border-box; }
button.yarr:disabled { opacity:.35; }
.chip.att { background: color-mix(in srgb, var(--primary-color) 18%, transparent); color: var(--primary-color); font-weight:500; }
td.c { text-align:center; width:1%; white-space:nowrap; }
button.attn { font-size:15px; padding:2px 4px; min-height:0; text-decoration:none; display:inline-flex; align-items:center; gap:1px; }
button.attn b { font-size:11px; font-weight:600; background: var(--primary-color); color: var(--text-primary-color, #fff); border-radius:8px; padding:0 5px; margin-left:2px; line-height:16px; }
.chip small { color: var(--secondary-text-color); }
.tot { display:flex; justify-content:space-between; padding:4px 4px 2px; color: var(--secondary-text-color); font-size:14px; }
.tot b { color: var(--primary-text-color); }
.fab { display:none; position:fixed; right:20px; bottom:20px; width:56px; height:56px; border-radius:50%; font-size:28px; line-height:1; padding:0; background: var(--primary-color); color: var(--text-primary-color, #fff); border:none; box-shadow: 0 4px 12px rgba(0,0,0,.35); z-index:4; }
.backdrop { position:fixed; inset:0; background: rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:10; }
.dialog { background: var(--card-background-color); border-radius:16px; width:min(720px, calc(100vw - 32px)); max-height: calc(100vh - 32px); box-sizing:border-box; display:flex; flex-direction:column; overflow:hidden; border-top:4px solid var(--mc, var(--primary-color)); margin:0; }
.dhead { display:flex; align-items:center; gap:8px; padding:14px 12px 10px 20px; border-bottom:1px solid var(--divider-color); position:relative; }
.dhead h2 { margin:0; font-size:18px; font-weight:500; flex:1; }
.grab { display:none; }
button.x { background:none; border:none; font-size:18px; color: var(--secondary-text-color); width:40px; padding:0; }
.dbody { overflow-y:auto; padding:16px 20px; flex:1; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
.grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:12px; }
.grid input, .grid select { width:100%; }
.wide { grid-column: 1 / -1; }
fieldset { border:1px solid var(--divider-color); border-radius:10px; padding:8px 12px 12px; margin:0; }
legend { font-size:13px; color: var(--secondary-text-color); padding:0 4px; }
.zones { display:flex; flex-wrap:wrap; gap:12px; align-items:flex-end; }
.zones label { width:140px; }
.actions { display:flex; align-items:center; gap:8px; padding:12px 20px; border-top:1px solid var(--divider-color); background: var(--card-background-color); }
.actions .sp { flex:1; }
.msg.err { background: rgba(219,68,55,.15); color: var(--error-color, #db4437); margin-top:12px; }
.card { border-left:4px solid var(--mc, var(--divider-color)); }
.ctop { display:flex; align-items:flex-start; gap:10px; }
.ctitle { display:flex; align-items:flex-start; gap:2px; flex:1; min-width:0; }
.ctitle .dot { margin-top:7px; }
.cname { font-size:16px; font-weight:500; }
.csub { font-size:13px; color: var(--secondary-text-color); margin-top:1px; overflow:hidden; text-overflow:ellipsis; }
.cval { text-align:right; }
.cval .camt { font-size:17px; }
.cvsub { font-size:12px; margin-top:2px; }
.chev { color: var(--secondary-text-color); font-size:24px; line-height:20px; margin-left:2px; }
.card .chips { margin-top:10px; }
.chip.price { background: color-mix(in srgb, var(--mc, var(--primary-color)) 18%, transparent); }
.chip.ok { color: var(--success-color, #4FB477); }
.chip.bad { color: var(--error-color, #E0643A); }
.cnote { margin-top:8px; font-size:13px; color: var(--secondary-text-color); font-style:italic; }
.sumbar { display:flex; justify-content:space-between; align-items:center; gap:8px; margin:-4px 0 12px; font-size:13px; }
.sumbar button { margin-top:0; }
.sumbar .sp { flex:1; } .exp { display:inline-flex; gap:6px; } .exp button { margin-top:0; }
.schart .ctitle { display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:6px; padding:0 4px 6px; }
.schart svg { height:170px; } .schart .pline { fill:none; stroke: var(--secondary-text-color); stroke-width:1.5; stroke-dasharray:4 3; opacity:.6; vector-effect: non-scaling-stroke; }
.schart .pdot { stroke: var(--primary-text-color); stroke-width:2.5; vector-effect: non-scaling-stroke; }
.lg.pdl { background:none; border-top:2px dashed var(--secondary-text-color); height:0; margin-top:6px; }
.yoy { font-size:13px; font-weight:500; } .yoy small { color: var(--secondary-text-color); font-weight:400; }
.impcols td, .impcols th, .imptab td, .imptab th { font-size:13px; padding:6px 8px; } .mono { font-family: ui-monospace, monospace; }
.tpl { gap:8px; align-items:center; margin:10px 0; } .tpl button { margin-top:0; }
.impres { display:flex; gap:12px; flex-wrap:wrap; margin:12px 0 4px; font-weight:500; } .imperr { margin:4px 0; padding-left:18px; font-size:13px; color: var(--error-color); }
label.chk { display:flex; gap:8px; align-items:center; margin-bottom:10px; }
.attbox { border:1px dashed var(--divider-color); border-radius:10px; padding:10px 12px; margin-bottom:14px; display:flex; flex-direction:column; gap:8px; }
.attrow { display:flex; align-items:center; gap:8px; font-size:14px; } .attrow a { color: var(--primary-color); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsplit { display:flex; flex:1; min-height:0; }
.dsplit > .dbody { min-width:0; }
.dialog.wp { width:min(1360px, calc(100vw - 32px)); height:calc(100vh - 32px); }
.dialog.wp .dbody { flex:0 0 min(500px, 46%); }
.prev { flex:1 1 0; min-width:0; display:flex; flex-direction:column; border-right:1px solid var(--divider-color); background: var(--secondary-background-color, rgba(127,127,127,.08)); }
.prevbar { display:flex; align-items:center; gap:6px; padding:6px 10px; border-bottom:1px solid var(--divider-color); font-size:13px; min-width:0; }
.prevbar .sp { flex:1; }
.prevbar .pname { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; color: var(--secondary-text-color); }
button.ptab { min-height:28px; padding:2px 10px; font-size:12px; border-radius:14px; margin:0; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:0 0 auto; }
button.ptab.on { border-color: var(--primary-color); color: var(--primary-color); }
.prevbody { flex:1; min-height:0; display:flex; align-items:center; justify-content:center; overflow:auto; }
.prevbody iframe { width:100%; height:100%; border:0; background:#fff; }
.prevbody img { max-width:100%; max-height:100%; object-fit:contain; }
.pmsg { padding:24px; }
.mobonly { display:none; }
.attact { display:flex; flex-wrap:wrap; gap:8px; }
.filebtn { display:inline-flex; flex-direction:row; align-items:center; gap:6px; min-height:40px; padding:0 14px; border:1px solid var(--divider-color); border-radius:8px; background: var(--card-background-color); color: var(--primary-text-color); font-size:14px; cursor:pointer; }
.filebtn.dis { opacity:.6; pointer-events:none; }
.aimsg { font-size:13px; padding:8px 10px; border-radius:8px; background: color-mix(in srgb, var(--primary-color) 15%, transparent); }
.aifill { outline:2px solid #b38cff !important; outline-offset:-1px; background: color-mix(in srgb, #b38cff 12%, var(--card-background-color)) !important; }
.pchips { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px; }
.pchip { border-radius:18px; min-height:36px; padding:6px 14px; }
.pchip.on { background: var(--primary-color); border-color: var(--primary-color); color: var(--text-primary-color, #fff); }
.mchips { margin:-6px 0 14px; }
.pchip.mchip .dot { background: var(--mc); }
.pchip.mchip.on { background: color-mix(in srgb, var(--mc) 30%, transparent); border-color: var(--mc); color: var(--primary-text-color); font-weight:500; box-shadow: inset 0 0 0 1px var(--mc); }
.tchart .ctitle { display:flex; align-items:center; gap:6px; margin-bottom:6px; } .tchart .ctitle .dot { margin:0; }
.txax { position:relative; height:18px; font-size:12px; color: var(--secondary-text-color); } .txax span { position:absolute; top:2px; transform:translateX(-50%); } .txax span.l { transform:none; } .txax span.r { transform:translateX(-100%); } .tchart .ctitle small { margin-left:auto; }
.tplot { position:relative; } .tplot svg { height:170px; }
.tyax { position:absolute; left:2px; top:2px; bottom:24px; display:flex; flex-direction:column; justify-content:space-between; font-size:11px; color: var(--secondary-text-color); pointer-events:none; }
.tyax span { background: color-mix(in srgb, var(--card-background-color, #fff) 75%, transparent); padding:0 3px; border-radius:3px; }
.chart .tline { fill:none; stroke-width:2.5; vector-effect: non-scaling-stroke; stroke-linejoin:round; }
.chart .tgrid { stroke: var(--divider-color); stroke-width:1; vector-effect: non-scaling-stroke; }
.ystats i.lg { display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:5px; vertical-align:middle; }
.tabchks { display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap:2px 12px; }
.pchip.add { border-style:dashed; color: var(--primary-color); }
.empty { padding:24px; text-align:center; color: var(--secondary-text-color); border-left-width:1px; }
.kpi b.sm { font-size:17px; } .kpi b.sm small { font-size:12px; color: var(--secondary-text-color); font-weight:400; }
.prog { margin-bottom:12px; border-left-width:1px; }
.ptop { display:flex; justify-content:space-between; font-size:14px; color: var(--secondary-text-color); } .ptop b { color: var(--primary-text-color); }
.pbar { height:10px; border-radius:5px; background: var(--secondary-background-color); margin-top:8px; overflow:hidden; }
.pbar span { display:block; height:100%; background: linear-gradient(90deg, var(--primary-color), var(--success-color, #4FB477)); border-radius:5px; }
.chart { margin-bottom:12px; padding:10px 8px 8px; border-left-width:1px; }
.chart svg { width:100%; height:200px; display:block; }
.chart text { fill: var(--secondary-text-color); font-size:12px; }
.chart .bsv { fill: var(--primary-color); } .chart .bok { fill: var(--success-color, #4FB477); } .chart .proj { opacity:.4; }
.chart .inv { fill:none; stroke: var(--error-color, #E0643A); stroke-width:2; stroke-dasharray:6 4; }
.chart .nowcol { fill: var(--secondary-background-color); }
.chart .yhit { fill: transparent; cursor:pointer; outline:none; }
.chart .yhit.on { fill: color-mix(in srgb, var(--primary-color) 14%, transparent); }
.chart .yhit:focus-visible { fill: color-mix(in srgb, var(--primary-color) 22%, transparent); }
.ydet { border-top:1px solid var(--divider-color); margin-top:8px; padding:10px 6px 2px; }
.yhead { display:flex; align-items:center; gap:10px; margin-bottom:8px; } .yhead b { font-size:17px; font-weight:500; } .yhead .yarr { min-height:32px; height:32px; width:32px; min-width:32px; font-size:18px; }
.yhead small { flex:1; }
.ystats { display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:8px 14px; }
.ystats div { display:flex; flex-direction:column; } .ystats span { font-size:12px; color: var(--secondary-text-color); } .ystats b { font-size:17px; font-weight:500; font-variant-numeric: tabular-nums; } .ystats small { font-size:11px; color: var(--secondary-text-color); }
.ymon { display:flex; align-items:flex-end; gap:3px; margin:14px 0 4px; }
.ym { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; min-width:0; }
.ym i { display:block; width:72%; background: var(--success-color, #4FB477); border-radius:2px 2px 0 0; min-height:1px; } .ym i.neg { background: var(--error-color, #E0643A); } .ym.est i { opacity:.45; }
.ym .yv { font-size:10px; color: var(--secondary-text-color); margin-bottom:2px; font-variant-numeric: tabular-nums; } .ym .yl { font-size:10px; line-height:14px; color: var(--secondary-text-color); margin-top:3px; white-space:nowrap; overflow:hidden; max-width:100%; }
.ysub { font-size:13px; color: var(--secondary-text-color); margin:12px 0 2px; }
.ydet .rrow { padding:7px 0; } .ydet .rlbl > span { display:flex; align-items:center; gap:4px; }
table.yrs tr.yrow { cursor:pointer; } table.yrs tr.yrow.on td { background: color-mix(in srgb, var(--primary-color) 12%, transparent); }
.legend { display:flex; flex-wrap:wrap; gap:12px; font-size:12px; color: var(--secondary-text-color); padding:6px 4px 0; }
.lg { display:inline-block; width:12px; height:10px; border-radius:2px; margin-right:5px; vertical-align:middle; background: var(--primary-color); }
.lg.proj { opacity:.4; } .lg.line { height:0; border-top:2px dashed var(--error-color, #E0643A); background:none; }
.rules { padding:4px 14px; border-left-width:1px; }
.rrow { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid var(--divider-color); }
.rrow:last-child { border-bottom:none; }
.prows { display:grid; gap:2px; padding:0 0 8px 14px; border-bottom:1px solid var(--divider-color); margin-top:-6px; }
.prow { display:grid; grid-template-columns:minmax(0,1fr) auto auto; gap:10px; align-items:center; font-size:13px; }
.prow span { display:flex; align-items:center; gap:6px; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.prow i { width:10px; height:10px; border-radius:2px; flex:none; }
.prow small { color: var(--secondary-text-color); font-variant-numeric:tabular-nums; }
.prow b { font-weight:500; font-variant-numeric:tabular-nums; }
.pbar { display:flex; gap:2px; height:6px; margin-top:8px; border-radius:3px; overflow:hidden; }
.pbar span { display:block; height:100%; min-width:2px; }
.plegend { display:block; margin-top:4px; }
.rlbl { display:flex; flex-direction:column; } .rlbl small { color: var(--secondary-text-color); font-size:12px; margin-left:14px; }
tr.projrow td { color: var(--secondary-text-color); }
table.yrs td small { display:block; font-size:11px; }
.small { font-size:13px; } button.small { min-height:34px; padding:6px 12px; margin-top:8px; }
.set { margin-bottom:14px; padding:14px; }
.set h4, .dbody h4 { margin:16px 0 8px; font-weight:500; font-size:14px; color: var(--secondary-text-color); text-transform:uppercase; letter-spacing:.04em; }
.shead { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:16px; }
.zone, .rule, .src { border:1px solid var(--divider-color); border-radius:10px; padding:10px; margin-top:10px; background: color-mix(in srgb, var(--secondary-background-color) 50%, transparent); }
.rule { border-left:4px solid var(--mc, var(--divider-color)); }
.src { background: var(--card-background-color); }
.zhead { display:flex; align-items:flex-end; gap:8px; } .zhead label { flex:1; }
.zhead input, .mt input, .mt textarea { width:100%; }
.lbl { font-size:12px; color: var(--secondary-text-color); margin:10px 0 4px; }
.ids { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.ent { display:inline-flex; align-items:center; gap:6px; background: var(--secondary-background-color); border-radius:16px; padding:4px 4px 4px 10px; font-size:13px; max-width:100%; }
.ent small { color: var(--secondary-text-color); font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:160px; }
button.xs { min-height:24px; width:24px; padding:0; border-radius:50%; font-size:12px; border:none; }
.addent { flex:1; min-width:180px; }
label.mt { margin-top:10px; }
.hint { font-size:13px; margin-top:0; }
.savebar { position:sticky; bottom:0; padding:12px 0; background: linear-gradient(transparent, var(--primary-background-color) 30%); z-index:1; margin-top:8px; }
.savebar button { width:100%; min-height:46px; }
details.adv { margin-top:16px; } details.adv summary { cursor:pointer; color: var(--secondary-text-color); padding:8px 0; }
.row { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
.tpls { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; } .tpls button { flex:1; min-width:140px; }
@media (max-width: 700px) {
  .desk { display:none; }
  .cards.mob { display:flex; }
  .content { padding:12px; padding-bottom:96px; }
  .tabs { padding:8px 12px; }
  #add { display:none; }
  .fab { display:block; }
  .filters { gap:10px; }
  .filters label { flex:1; min-width:0; }
  .filters label.ylab { flex:0 0 auto; }
  .ystep { gap:4px; }
  .ystep select { width:84px; padding-left:8px; padding-right:4px; }
  button.yarr { width:36px; min-width:36px; }
  .kpis { grid-template-columns: 1fr 1fr; gap:8px; }
  .kpi b { font-size:18px; }
  .backdrop { align-items:flex-end; }
  .dialog { width:100vw; max-width:100vw; max-height:92vh; max-height:92dvh; border-radius:18px 18px 0 0; }
  .dhead { padding:18px 8px 10px 16px; }
  .grab { display:block; position:absolute; top:6px; left:50%; transform:translateX(-50%); width:40px; height:4px; border-radius:2px; background: var(--divider-color); }
  .dbody { padding:14px 16px; }
  .dialog.wp { width:100vw; height:92vh; height:92dvh; }
  .dialog.wp .dbody { flex:1 1 auto; }
  .dsplit { flex-direction:column; }
  .prev { flex:0 0 auto; border-right:none; border-bottom:1px solid var(--divider-color); }
  .prevbody { flex:none; height:42vh; height:42dvh; }
  .prev.hid .prevbody { display:none; }
  .mobonly { display:inline-block; }
  .grid { grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap:12px 10px; }
  .grid > * { min-width:0; }
  input[type=date], input[type=month] { -webkit-appearance:none; appearance:none; width:100%; min-width:0; max-width:100%; display:block; text-align:left; }
  input::-webkit-date-and-time-value { text-align:left; }
  .grid > * { grid-column: 1 / -1; }
  .grid > .half { grid-column: auto; }
  .zones label { width:calc(50% - 6px); }
  select, input, textarea { font-size:16px; min-height:44px; }
  .actions { padding:10px 16px calc(10px + env(safe-area-inset-bottom)); }
  .actions button { min-height:46px; }
  .actions button.primary { min-width:110px; }
  .actions button { min-height:44px; }
}
  .hpnorm { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; margin-top: 6px; }
  .hpnorm label { font-size: 11px; display: flex; flex-direction: column; gap: 2px; }
  .hpnorm input { width: 100%; min-width: 0; box-sizing: border-box; }
  @media (max-width: 520px) { .hpnorm { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  details.mt summary { cursor: pointer; font-size: 13px; color: var(--secondary-text-color); }
  /* settings – readable on wide screens */
  .wiz { max-width: 1200px; margin: 0 auto; }
  .setgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr)); gap: 0 14px; align-items: start; }
  .medh { margin: 22px 0 10px; }
  details.med { padding: 0; overflow: hidden; border-left: 4px solid var(--mc); }
  details.med > summary { list-style: none; cursor: pointer; padding: 14px 16px; margin: 0; gap: 12px; }
  details.med > summary::-webkit-details-marker { display: none; }
  details.med > summary:hover { background: color-mix(in srgb, var(--mc) 8%, transparent); }
  .mtitle { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; min-width: 0; }
  .mtitle small { color: var(--secondary-text-color); font-size: 13px; font-weight: 400; }
  .mdot { width: 10px; height: 10px; border-radius: 50%; background: var(--mc); align-self: center; flex: none; }
  .chev { font-size: 22px; color: var(--secondary-text-color); transition: transform .15s; line-height: 1; }
  details.med[open] .chev { transform: rotate(90deg); }
  details.med[open] > summary { border-bottom: 1px solid var(--divider-color); }
  .mbody { padding: 4px 16px 16px; }
  .mtop { display: flex; justify-content: flex-end; }
  .grid.g3 { grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); max-width: 760px; }
  .zgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 460px), 1fr)); gap: 0 12px; align-items: start; }
  .zone { container-type: inline-size; }
  .zhead input { max-width: 420px; }
  label.sync input { max-width: 420px; }
  .src { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 4px 10px; align-items: end; }
  .src > label input { width: 100%; box-sizing: border-box; height: 42px; }
  .src .sids, .src .srm { grid-column: 1 / -1; }
  .src .srm { justify-self: start; }
  .src .lbl { margin-top: 6px; }
  @container (min-width: 620px) {
    .src { grid-template-columns: 150px 96px minmax(0, 1fr) auto; align-items: start; }
    .src .sids { grid-column: 3; }
    .src .sids .lbl { margin-top: 0; }
    .src .srm { grid-column: 4; align-self: end; padding-bottom: 10px; }
  }
  input[data-lazydate][type=text]::placeholder { color: var(--secondary-text-color); font-style: italic; }
  /* heat pump what-if view */
  .simseason { margin-bottom: 4px; }
  .simseason small { font-weight: 400; opacity: .8; }
  .simgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap: 14px; align-items: stretch; margin-top: 14px; }
  .simctl h3, .simdev h3, .simchart h3 { margin: 0 0 10px; font-size: 15px; }
  .simctl, .simdev, .simchart, .simnote { padding: 14px 16px; }
  .simnote { margin-top: 14px; } .simnote p { margin: 0; white-space: pre-line; }
  label.simr { margin-bottom: 14px; gap: 6px; }
  label.simr > span { display: flex; justify-content: space-between; color: var(--primary-text-color); font-size: 14px; }
  label.simr b { color: var(--primary-color); font-size: 15px; }
  label.simr input[type=range] { width: 100%; accent-color: var(--primary-color); }
  label.simr small { font-size: 12px; }
  .simbtn { display: flex; gap: 8px; flex-wrap: wrap; }
  .simdev .rrow.tot { border-top: 1px solid var(--divider-color); margin-top: 6px; padding-top: 8px; }
  .simchart { margin-top: 14px; }
  .sbars { display: flex; gap: 6px; align-items: flex-end; overflow-x: auto; padding-top: 4px; }
  .sb { flex: 1 0 34px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: default; }
  .sv { font-size: 11px; color: var(--success-color, #4FB477); min-height: 14px; }
  .sv.neg { color: var(--error-color, #db4437); }
  .sstack { position: relative; width: 70%; max-width: 46px; display: flex; flex-direction: column-reverse; }
  .sstack i { display: block; width: 100%; }
  .sstack .sgas { border-radius: 0 0 3px 3px; }
  .sstack .sel { border-radius: 3px 3px 0 0; }
  .sstack .sbase { position: absolute; left: -15%; width: 130%; height: 0; border-top: 2px dashed var(--primary-text-color); opacity: .55; }
  .sl { font-size: 11px; color: var(--secondary-text-color); }
  .slegend { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 10px; font-size: 12px; color: var(--secondary-text-color); }
  .slegend span { display: inline-flex; align-items: center; gap: 6px; }
  .slegend i { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
  .slegend i.dash { width: 16px; height: 0; border-top: 2px dashed var(--primary-text-color); border-radius: 0; opacity: .6; }
  .simtop { grid-template-columns: minmax(300px, 380px) minmax(0, 1fr); }
  .simtop > [data-simc] > .simchart { margin-top: 0; height: 100%; box-sizing: border-box; }
  @media (max-width: 860px) { .simtop { grid-template-columns: minmax(0, 1fr); } }
  [data-simt] { margin-top: 14px; }
  table.simtab td, table.simtab th { white-space: nowrap; }
  .exphead { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-top: 22px; }
  .exphead h3 { margin: 0; }
  .exptools { display: flex; gap: 8px; }
  .exptools button, .exptools #add { display: inline-flex; align-items: center; min-height: 36px; box-sizing: border-box; }
  /* project dialog – same layout as settings */
  .dialog.pd { width: min(1040px, calc(100vw - 32px)); }
  .grid.g4 { grid-template-columns: repeat(auto-fill, minmax(min(100%, 190px), 1fr)); }
  .grid.g4 { align-items: end; }
  .grid.pfields { grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr)); }
  details.rule { padding: 0; overflow: hidden; container-type: inline-size; }
  details.rule > summary { list-style: none; cursor: pointer; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  details.rule > summary::-webkit-details-marker { display: none; }
  details.rule > summary:hover { background: color-mix(in srgb, var(--mc) 8%, transparent); }
  details.rule[open] > summary { border-bottom: 1px solid var(--divider-color); }
  details.rule[open] .chev { transform: rotate(90deg); }
  details.rule .mdot { background: var(--mc); }
  .rbody { padding: 4px 14px 14px; }
  .rbody h5 { margin: 18px 0 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--secondary-text-color); }
  .hpdevs { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
  .hpdev { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) auto; gap: 8px 10px; align-items: end; border: 1px solid var(--divider-color); border-radius: 10px; padding: 10px; background: var(--card-background-color); }
  .hpdev .dname { grid-column: 1 / -1; }
  .hpdev input { width: 100%; box-sizing: border-box; height: 42px; }
  .hpdev .drm { align-self: center; padding: 8px; }
  @container (min-width: 620px) {
    .hpdev { grid-template-columns: minmax(0, 3fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) auto; }
    .hpdev .dname { grid-column: auto; }
  }
  @media (max-width: 700px) { .grid.pfields { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .grid.pfields .pname { grid-column: 1 / -1; } }
  .sb.meas .sstack { outline: 2px solid var(--success-color, #4FB477); outline-offset: 2px; border-radius: 3px; }
  .sb.meas.part .sstack { outline-style: dashed; }
  .mtag { font-size: 11px; color: var(--success-color, #4FB477); white-space: nowrap; }
`;
