# Changelog

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
