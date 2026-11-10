# Changelog

## 0.9.0
- Investments: a project with a *Heat pump simulation* rule opens as a what-if view instead of the payback view: heating seasons (September–August) as chips, tiles with heating by gas today, gas + electricity with the pumps, the saving and the pump electricity, sliders for the share of heating, electricity in the cheaper tariff zone, extra losses, pump efficiency vs. catalogue and boiler efficiency (results update instantly; *Save to project* stores them), a month-by-month chart of the remaining gas and the pump electricity against the all-gas cost, a monthly table with the mean temperature, and the devices with the coldest-day power. The payback chart is still shown when the project has expenses.
- Investments tab: the project chips are at the top; *Add expense* and *Import* moved to the *Expenses* section (they looked like "new project" before). No floating + button on this tab.
- Project dialog uses the settings layout: wider on large screens, name / start / horizon / growth in one row, each rule is a collapsible card with a summary, a meter source fits in one line, heat pump options are grouped (heating gas, assumptions, devices, outdoor temperature, electricity) and each device is one row (name, power, SCOP, lowest temperature).
- Heat pump rule: *Pumps heat since* date. Before it the rule simulates as before; from it the saving is measured – a degree-day model (gas per day = k × (15 °C − T)) fitted on the days before the switch gives the gas the house would have needed, and the saving is that minus the gas actually burnt; pump electricity comes from the heat taken over and the COP at that day's temperature. Measured months are marked in the chart and table with the real share of the pumps; the sliders only change the simulated part.
- Measured period can read the pump electricity from the house meter: house consumption minus separately metered loads (washing machine, dryer, water heater…) minus the average of the days before the switch. Optional "hours in heating mode" sensors: on a day without heating the extra consumption is not given to the pumps. The view compares meter vs. COP model and shows the heating hours.
- Meter groups: the house can be split into groups (e.g. floors), each with its own meter, loads to subtract and heating-hour sensors; each group has its own baseline, so a quiet floor does not hide the pumps of the other. The comparison card shows the pump electricity per group.
- Docs: step-by-step guide "Heat pump simulation" (EN/PL) with a fictional example house – gas split by boiler status (YAML), outdoor temperature, house meters per floor, heating-hour helpers, rule settings – and screenshots.
- The ROI result of a heat pump rule carries per-month inputs at 100 % share (heating gas and its cost, replaceable gas, pump electricity and its cost per tariff zone, temperature, peak daily heat) so the view can rescale them.

## 0.8.1
- Settings are easier to read on large screens: the page is limited in width, *General* and *Tabs* sit side by side, every medium is a collapsible card whose header summarises unit, zones, number of sensors and usage split, zones and parts are laid out in two columns, and a meter source fits in one line (from, factor, sensors). An empty *From* date reads "from the start" instead of showing today's date greyed out (Safari).

## 0.8.0
- Investments: new rule *Heat pump simulation* – "what if part of the heat from the gas boiler came from air conditioners / heat pumps?". It takes the gas used for space heating (ideally the heating part from the 0.7.0 usage split), the outdoor temperature from HA statistics and a list of devices (max heat output, SCOP, lowest working temperature). For every day the boiler heat is computed (gas × kWh per unit × boiler efficiency), the chosen share is moved to the devices in proportion to their power, limited by their power and working range, and the electricity is heat ÷ COP at that day's temperature. The result is gas not burnt (priced with the gas tariff) minus electricity for the pumps (priced per tariff zone share, with optional extra losses e.g. for a home battery).
- Days without a temperature reading use typical monthly temperatures (editable per rule); days without gas data are estimated from the yearly estimate by heating degree days.
- The *heat pump instead of gas* template creates this rule, pre-filled with the heating part of gas and an outdoor temperature sensor when found.
- Rule totals show gas avoided, electricity added and both costs; the year details do too.
- Fix: choosing a project template no longer also triggered the import-template download handler (console error).

## 0.7.0
- Usage split: each medium can have optional parts with their own meters, e.g. gas for heating and gas for hot water, or electricity for the car and the water heater. Set them up in Settings → *Usage split*. Parts are informational and never change the cost: the variable cost of a month is shared in proportion to quantity, and whatever the parts do not cover (days before their meters existed, corrections, other use) is shown as *Not split*.
- The summary tiles show the split of the year as a bar, and the month details list each part with quantity, share and cost.

## 0.6.1
- Security: the `import_file`, `export` and `add_invoice` services are admin-only now (automations keep working). Non-admin users could read or replace the whole register through them.
- `import_file` only reads files inside the configuration folder: the path is resolved (symlinks, `..`) and checked with `Path.is_relative_to`, so sibling folders such as `/config_backup` are rejected. Resolving and reading happen in the executor, not in the event loop.
- README: installation leads with searching the Marketplace / HACS.

## 0.6.0
- Investments tab moved right after the summary.
- Settings → *Tabs in the menu*: every tab except Summary and Settings can be hidden (e.g. Instalments, Tariffs or Investments when you do not need them). Data and calculations are kept.
- Investments: an *All* chip (first and selected by default when there is more than one project) adds up every project – invested, saved, payback month and average per year – on one chart with the cumulative savings stacked per project. The year details show the split per project and per rule; the expense list shows the project of each purchase.
- The medium filter is a row of chips instead of a drop-down, on every tab that has it. Several media can be selected at once; *All* clears the filter.
- Tariffs tab: when a medium is selected and it has more than one tariff, a price-history chart shows the unit price per zone over time. Click (or hover / keyboard) a period to see that tariff: prices with the change against the previous tariff and the first one, fixed fee, supplier and note; ‹ › steps through the tariffs.
- Monthly cost chart on the summary tab is interactive: click (or hover / keyboard) a month to see the cost and quantity per medium, the same month last year with the change, and the invoices covering that month. ‹ › steps through the months.
- Fix: on phones the year selector with arrows overlapped the medium filter.
- Investment payback chart is interactive: click (or hover / keyboard) a year to see that year's savings and expenses, cumulative savings vs. invested, the balance, a monthly breakdown, totals per rule and the expenses booked in that year. ‹ › steps through the years; rows of the year table select the year too. The current year is marked *year to date*.
- Full Polish documentation in [README.pl.md](README.pl.md) with Polish screenshots; all screenshots refreshed.

## 0.5.0
- Invoice editor shows the attached PDF or photo next to the form (above it on phones, can be hidden); several files can be switched.
- Invoice list shows a 📎 marker with the number of attachments.
- ‹ › arrows next to the year selector.
- Controls in toolbars and editors have the same height.
- Fix: meters whose long-term statistic sum was restarted by Home Assistant after a data gap no longer produce a huge negative value; the state difference is used instead.

## 0.4.0
- Investment payback results are stored; only the current month is recalculated (instant tab, *Recalculate* button).
- Notifications: upcoming instalments and invoices that differ from the meters (persistent notification and optional `notify` service).
- Summary chart: monthly cost by medium with the previous year and the year-over-year change.
- Dashboard card `custom:utility-costs-card` and sensors *Cost this month* / *Year forecast*.
- Export of a year to Excel (.xlsx) and CSV.
- Import of invoices, instalments, tariffs and investment expenses from Excel / CSV with preview, templates and duplicate detection.
- Fix: blank panel on the first open (properties set before the element was defined).

## 0.3.0
- Invoice attachments (PDF/photos) and AI reading via `ai_task`.
- Year summaries cached in `.storage`, background recalculation, *Recalculate* button.

## 0.2.0
- Investments / payback: projects, generic rules, templates (PV, heat pump, EV).
- Settings wizard instead of raw JSON.
- Mobile-first panel (cards, bottom-sheet editor).

## 0.1.0
- First version: media, tariffs, invoices, instalments, readings, corrections, sensors, services.
