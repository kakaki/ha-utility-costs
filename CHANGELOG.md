# Changelog

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
