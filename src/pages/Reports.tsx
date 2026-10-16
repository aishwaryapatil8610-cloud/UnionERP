import type * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FileDown, FileSpreadsheet, Printer } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type Column } from '../components/ui/DataTable';
import { downloadReportPdf } from '../lib/pdf';
import { ChartTip } from '../components/ChartTip';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useChartColors } from '../context/ThemeContext';
import { downloadCsv } from '../lib/csv';
import { fmtDate, inr, nf } from '../lib/format';

type Val = string | number;
type Row = Record<string, Val> & { id: string };
interface Report {
  key: string; emoji: string; title: string; blurb: string;
  stats: { label: string; value: string }[];
  chartTitle: string; chart: { name: string; value: number }[]; unit: string;
  rows: Row[];
}

const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
function groupSum<T>(rows: T[], key: (r: T) => string, val: (r: T) => number) {
  const m = new Map<string, number>();
  rows.forEach((r) => m.set(key(r), (m.get(key(r)) ?? 0) + val(r)));
  return [...m.entries()].map(([name, value]) => ({ name, value: Math.round(value) }));
}
const MONEY = new Set(['Value', 'Amount', 'Debit', 'Credit', 'Rate', 'Basic', 'PF', 'Net']);
/** Columns that get a grand total at the bottom of each report. */
const SUM_KEYS: Record<string, string[]> = {
  daily: ['Litres', 'Value'], farmer: ['Litres', 'Value'], reception: ['Litres'], dispatch: ['Litres'], production: ['Milk in (L)'],
  accounts: ['Debit', 'Credit'], sales: ['Amount'], stock: ['Value'], payroll: ['Basic', 'PF', 'Net'], gate: [],
};
const fmtCell = (k: string, v: Val) => (typeof v === 'number' ? (MONEY.has(k) ? inr(v) : nf(v, v % 1 ? 2 : 0)) : v);
const LIGHT = { grid: '#E2DCF7', tick: '#6A648C', brand: '#7C3AED', accent: '#EC4899' };
const tidy = (k: string) => k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

const Reports: React.FC = () => {
  const { db, settings } = useData();
  const toast = useToast();
  const col = useChartColors();
  const [key, setKey] = useState('daily');

  const reports: Report[] = useMemo(() => {
    const days = [...new Set(db.collections.map((c) => c.date))].sort();
    const daily = days.map((d) => {
      const rows = db.collections.filter((c) => c.date === d);
      return { id: d, Date: d, Farmers: new Set(rows.map((r) => r.farmerId)).size, Litres: Math.round(sum(rows.map((r) => r.qty))), 'Avg fat': +(sum(rows.map((r) => r.fat)) / rows.length).toFixed(2), 'Avg SNF': +(sum(rows.map((r) => r.snf)) / rows.length).toFixed(2), Value: Math.round(sum(rows.map((r) => r.amount))) } as Row;
    });
    const perFarmer = db.farmers.map((f) => {
      const rows = db.collections.filter((c) => c.farmerId === f.id);
      return { id: f.id, Farmer: f.name, Village: f.village, Centre: f.centre, Litres: Math.round(sum(rows.map((r) => r.qty))), 'Avg fat': rows.length ? +(sum(rows.map((r) => r.fat)) / rows.length).toFixed(2) : 0, Value: Math.round(sum(rows.map((r) => r.amount))) } as Row;
    }).sort((a, b) => Number(b.Litres) - Number(a.Litres));
    const acc = db.reception.filter((r) => r.status === 'Accepted');
    const debit = sum(db.vouchers.map((v) => v.debit)), credit = sum(db.vouchers.map((v) => v.credit));
    const payroll = db.employees.map((e) => ({ id: e.id, Employee: e.name, Department: e.dept, Role: e.role, Basic: e.salary, PF: Math.round(e.salary * 0.12), Net: e.salary - Math.round(e.salary * 0.12) } as Row));
    return [
      { key: 'daily', emoji: '📅', title: 'Daily collection', blurb: 'Litres, fat, SNF and value collected each day.', stats: [{ label: 'Days', value: String(daily.length) }, { label: 'Total litres', value: nf(sum(daily.map((d) => Number(d.Litres)))) }, { label: 'Total value', value: inr(sum(daily.map((d) => Number(d.Value)))) }, { label: 'Avg per day', value: nf(sum(daily.map((d) => Number(d.Litres))) / (daily.length || 1)) + ' L' }], chartTitle: 'Litres per day', chart: daily.map((d) => ({ name: String(d.Date).slice(5), value: Number(d.Litres) })), unit: 'L', rows: daily },
      { key: 'farmer', emoji: '👨‍🌾', title: 'Farmer-wise', blurb: 'Who supplies how much, with average fat and value.', stats: [{ label: 'Farmers', value: String(perFarmer.length) }, { label: 'Top supplier', value: String(perFarmer[0]?.Farmer ?? '-') }, { label: 'Top litres', value: nf(Number(perFarmer[0]?.Litres ?? 0)) }, { label: 'Total value', value: inr(sum(perFarmer.map((p) => Number(p.Value)))) }], chartTitle: 'Top 8 farmers by litres', chart: perFarmer.slice(0, 8).map((p) => ({ name: String(p.Farmer).split(' ')[0], value: Number(p.Litres) })), unit: 'L', rows: perFarmer },
      { key: 'reception', emoji: '🥛', title: 'Milk reception', blurb: 'Tankers received with lab result and decision.', stats: [{ label: 'Tankers', value: String(db.reception.length) }, { label: 'Accepted litres', value: nf(sum(acc.map((r) => r.qty))) }, { label: 'Rejected', value: String(db.reception.filter((r) => r.status === 'Rejected').length) }, { label: 'Pending', value: String(db.reception.filter((r) => r.status === 'Pending').length) }], chartTitle: 'Accepted litres per day', chart: groupSum(acc, (r) => r.date.slice(5), (r) => r.qty).sort((a, b) => a.name.localeCompare(b.name)), unit: 'L', rows: db.reception.map((r) => ({ id: r.id, Date: r.date, Tanker: r.tanker, Route: r.route, Litres: r.qty, Fat: r.fat, SNF: r.snf, Temp: r.temp, Silo: r.silo, Status: r.status })) },
      { key: 'gate', emoji: '🚪', title: 'Gate register', blurb: 'Vehicle and visitor movement.', stats: [{ label: 'Entries', value: String(db.gate.length) }, { label: 'Inside now', value: String(db.gate.filter((g) => g.status === 'Inside').length) }, { label: 'Tankers in', value: String(db.gate.filter((g) => g.type === 'Milk tanker in').length) }, { label: 'Visitors', value: String(db.gate.filter((g) => g.type === 'Visitor').length) }], chartTitle: 'Entries by type', chart: groupSum(db.gate, (g) => g.type.replace(' / goods', ''), () => 1), unit: '', rows: db.gate.map((g) => ({ id: g.id, Date: g.date, Vehicle: g.vehicle, Driver: g.driver, Type: g.type, Party: g.party, In: g.timeIn, Out: g.timeOut, Status: g.status })) },
      { key: 'dispatch', emoji: '🚚', title: 'Dispatch', blurb: 'Milk sent out, by destination.', stats: [{ label: 'Trips', value: String(db.dispatch.length) }, { label: 'Litres sent', value: nf(sum(db.dispatch.map((d) => d.qty))) }, { label: 'Delivered', value: String(db.dispatch.filter((d) => d.status === 'Delivered').length) }, { label: 'In progress', value: String(db.dispatch.filter((d) => d.status !== 'Delivered').length) }], chartTitle: 'Litres by destination', chart: groupSum(db.dispatch, (d) => d.to, (d) => d.qty), unit: 'L', rows: db.dispatch.map((d) => ({ id: d.id, Date: d.date, Tanker: d.tanker, Destination: d.to, Litres: d.qty, Fat: d.fat, SNF: d.snf, Status: d.status })) },
      { key: 'production', emoji: '🧈', title: 'Production yield', blurb: 'Batches, milk used and finished output.', stats: [{ label: 'Batches', value: String(db.production.length) }, { label: 'Milk used', value: nf(sum(db.production.map((p) => p.milkIn))) + ' L' }, { label: 'Completed', value: String(db.production.filter((p) => p.status === 'Completed').length) }, { label: 'Products', value: String(new Set(db.production.map((p) => p.product)).size) }], chartTitle: 'Milk used by product', chart: groupSum(db.production, (p) => p.product, (p) => p.milkIn), unit: 'L', rows: db.production.map((p) => ({ id: p.id, Date: p.date, Batch: p.batch, Product: p.product, 'Milk in (L)': p.milkIn, Output: p.output + ' ' + p.unit, Status: p.status })) },
      { key: 'accounts', emoji: '📒', title: 'Accounts', blurb: 'Vouchers and net position by account.', stats: [{ label: 'Vouchers', value: String(db.vouchers.length) }, { label: 'Debit', value: inr(debit) }, { label: 'Credit', value: inr(credit) }, { label: 'Net', value: inr(credit - debit) }], chartTitle: 'Net by account (credit minus debit)', chart: groupSum(db.vouchers, (v) => v.account, (v) => v.credit - v.debit), unit: 'Rs', rows: db.vouchers.map((v) => ({ id: v.id, Date: v.date, Type: v.type, Account: v.account, Narration: v.narration, Debit: v.debit, Credit: v.credit })) },
      { key: 'sales', emoji: '🧾', title: 'Sales and dues', blurb: 'Invoices and what customers still owe.', stats: [{ label: 'Invoices', value: String(db.sales.length) }, { label: 'Sales', value: inr(sum(db.sales.map((s) => s.amount))) }, { label: 'Outstanding', value: inr(sum(db.sales.filter((s) => !s.paid).map((s) => s.amount))) }, { label: 'Customers', value: String(new Set(db.sales.map((s) => s.customer)).size) }], chartTitle: 'Outstanding by customer', chart: groupSum(db.sales.filter((s) => !s.paid), (s) => s.customer, (s) => s.amount), unit: 'Rs', rows: db.sales.map((s) => ({ id: s.id, Date: s.date, Customer: s.customer, Product: s.product, Qty: s.qty + ' ' + s.unit, Amount: s.amount, Payment: s.paid ? 'Paid' : 'Unpaid' })) },
      { key: 'stock', emoji: '📦', title: 'Stock valuation', blurb: 'Inventory quantity and value.', stats: [{ label: 'Items', value: String(db.items.length) }, { label: 'Low stock', value: String(db.items.filter((i) => i.stock <= i.reorder).length) }, { label: 'Stock value', value: inr(sum(db.items.map((i) => i.stock * i.rate))) }, { label: 'Categories', value: String(new Set(db.items.map((i) => i.category)).size) }], chartTitle: 'Stock value by category', chart: groupSum(db.items, (i) => i.category, (i) => i.stock * i.rate), unit: 'Rs', rows: db.items.map((i) => ({ id: i.id, Item: i.name, Category: i.category, Stock: i.stock + ' ' + i.unit, 'Reorder at': i.reorder, Rate: i.rate, Value: i.stock * i.rate })) },
      { key: 'payroll', emoji: '👥', title: 'Payroll', blurb: 'Monthly salary, PF and net pay.', stats: [{ label: 'Staff', value: String(payroll.length) }, { label: 'Gross', value: inr(sum(payroll.map((p) => Number(p.Basic)))) }, { label: 'PF', value: inr(sum(payroll.map((p) => Number(p.PF)))) }, { label: 'Net payable', value: inr(sum(payroll.map((p) => Number(p.Net)))) }], chartTitle: 'Gross salary by department', chart: groupSum(payroll, (p) => String(p.Department), (p) => Number(p.Basic)), unit: 'Rs', rows: payroll },
    ];
  }, [db]);

  const [printing, setPrinting] = useState(false);
  const rep = reports.find((r) => r.key === key) ?? reports[0];

  // Printing always uses light chart colours and a fixed chart size so the chart is never cut or blank.
  useEffect(() => {
    const before = () => flushSync(() => setPrinting(true));
    const after = () => setPrinting(false);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); };
  }, []);

  const keys = Object.keys(rep.rows[0] ?? {}).filter((k) => k !== 'id');
  const sumKeys = SUM_KEYS[rep.key] ?? [];
  const totals = useMemo(() => Object.fromEntries(sumKeys.map((k) => [k, rep.rows.reduce((s, r) => s + Number(r[k] ?? 0), 0)])), [rep, sumKeys]);
  const columns: Column<Row>[] = keys.map((k) => ({
    key: k, header: tidy(k), align: typeof rep.rows[0][k] === 'number' ? 'right' : 'left',
    cell: (r) => fmtCell(k, r[k]),
    sort: (r) => r[k],
  }));
  const isNum = (k: string) => typeof rep.rows[0]?.[k] === 'number';
  const hasTotals = sumKeys.length > 0 && rep.rows.length > 0;
  const totalCell = (k: string, i: number) => (i === 0 ? 'Grand total' : sumKeys.includes(k) ? fmtCell(k, totals[k]) : '');

  const dates = rep.rows.map((r) => String(r.Date ?? '')).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  const period = dates.length ? (dates[0] === dates[dates.length - 1] ? fmtDate(dates[0]) : fmtDate(dates[0]) + ' to ' + fmtDate(dates[dates.length - 1])) : '';
  const generated = useMemo(() => new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const palette = printing ? [LIGHT.brand, LIGHT.accent, '#5668B8', '#16A36C', '#EA8C14'] : [col.brand, col.accent, '#5668B8', '#16A36C', '#EA8C14'];
  const grid = printing ? LIGHT.grid : col.grid;
  const tick = printing ? LIGHT.tick : col.tick;
  const rot = rep.chart.length > 6;

  const chartEl = (w?: number, h?: number) => (
    <BarChart data={rep.chart} width={w} height={h} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
      <CartesianGrid stroke={grid} vertical={false} />
      <XAxis dataKey="name" tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={rot ? -35 : 0} height={rot ? 60 : 30} textAnchor={rot ? 'end' : 'middle'} />
      <YAxis tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v: number) => (Math.abs(v) >= 1000 ? Math.round(v / 1000) + 'k' : String(v))} />
      <Tooltip content={<ChartTip format={(v) => nf(v) + (rep.unit ? ' ' + rep.unit : '')} />} cursor={{ fill: grid }} />
      <Bar dataKey="value" name={rep.title} radius={[6, 6, 0, 0]} isAnimationActive={!printing}>{rep.chart.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}</Bar>
    </BarChart>
  );

  const pdf = async () => {
    try {
      await downloadReportPdf({
        filename: 'kshira-' + rep.key + '-report', plant: settings.plant, title: rep.title, blurb: rep.blurb, period: period ? 'Period: ' + period : undefined,
        stats: rep.stats, chartTitle: rep.chartTitle, chart: rep.chart, unit: rep.unit,
        headers: keys.map(tidy), aligns: keys.map((k) => (isNum(k) ? 'right' : 'left')),
        rows: rep.rows.map((r) => keys.map((k) => String(fmtCell(k, r[k])))),
        foot: hasTotals ? keys.map(totalCell) : undefined,
      });
      toast(rep.title + ' PDF downloaded');
    } catch { toast('Could not create the PDF, please try again'); }
  };
  const csv = () => { downloadCsv('kshira-' + rep.key + '-report', rep.rows.map(({ id, ...rest }) => { void id; return rest; })); toast(rep.title + ' CSV downloaded'); };

  const th = 'border border-line bg-brand px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white';
  const td = 'border border-line px-2 py-1.5 text-[10.5px] leading-snug text-ink';

  return (
    <div>
      <div className="print:hidden">
        <PageHeader title="Reports" subtitle="Pick a report to see live numbers, a chart and the full table. Print it or download it as PDF or CSV." />
        <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist">
          {reports.map((r) => (
            <button key={r.key} type="button" role="tab" aria-selected={r.key === key} onClick={() => setKey(r.key)} className={'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ' + (r.key === key ? 'border-transparent bg-gradient-to-r from-brand to-accent text-white shadow-lift' : 'border-line bg-panel text-ink hover:border-brand')}>
              <span>{r.emoji}</span>{r.title}
            </button>
          ))}
        </div>
      </div>

      {/* Report banner: shown on screen, in print and mirrored in the PDF */}
      <div className="print-card relative mb-4 overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-deep via-brand to-accent p-5 text-white shadow-lift sm:p-7 print:rounded-xl print:p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6 print:flex-row print:justify-between">
          <div className="min-w-0 sm:flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">{settings.plant} · SmartX ERP</p>
            <h2 className="mt-1.5 font-display text-2xl font-extrabold leading-tight sm:text-3xl">{rep.emoji} {rep.title}</h2>
            <p className="mt-1 max-w-xl text-sm text-white/85">{rep.blurb}</p>
          </div>
          <dl className="shrink-0 space-y-1 text-xs text-white/85 sm:text-right">
            {period && <div><dt className="inline text-white/60">Period: </dt><dd className="inline font-semibold">{period}</dd></div>}
            <div><dt className="inline text-white/60">Generated: </dt><dd className="inline font-semibold">{generated}</dd></div>
            <div><dt className="inline text-white/60">Rows: </dt><dd className="inline font-semibold tnum">{rep.rows.length}</dd></div>
          </dl>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-end print:hidden">
        <Button variant="outline" icon={<Printer size={16} />} onClick={() => window.print()}>Print</Button>
        <Button variant="outline" icon={<FileDown size={16} />} onClick={pdf}><span className="sm:hidden">PDF</span><span className="hidden sm:inline">Download PDF</span></Button>
        <Button icon={<FileSpreadsheet size={16} />} onClick={csv}><span className="sm:hidden">CSV</span><span className="hidden sm:inline">Download CSV</span></Button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4 print:mb-3 print:grid-cols-4 print:gap-2">
        {rep.stats.map((s) => (
          <Card key={s.label} className="print-card min-w-0 p-4 sm:p-5 print:rounded-xl print:p-3"><p className="text-[11px] font-semibold uppercase tracking-wider text-mute">{s.label}</p><p className="mt-1 break-words font-display text-xl font-extrabold leading-tight tnum sm:text-2xl lg:text-3xl print:text-lg">{s.value}</p></Card>
        ))}
      </div>

      <Card className="print-card mb-5 print:mb-3 print:rounded-xl">
        <CardHeader title={rep.chartTitle} subtitle={rep.unit ? 'Values in ' + rep.unit : undefined} className="print:px-4 print:pt-3" />
        <div className="px-2 pb-4 pt-3 sm:px-4 print:px-2 print:pb-2">
          {rep.chart.length ? (
            printing ? <div className="overflow-hidden">{chartEl(690, 210)}</div> : (
              <div className="h-64 sm:h-72"><ResponsiveContainer width="100%" height="100%">{chartEl()}</ResponsiveContainer></div>
            )
          ) : <p className="grid h-40 place-items-center text-mute">No data for this report yet.</p>}
        </div>
      </Card>

      {/* On screen: sortable, paged table */}
      <Card className="print:hidden">
        <CardHeader title="Report data" subtitle={rep.rows.length + ' rows'} className="pb-3" />
        <DataTable
          columns={columns} rows={rep.rows} rowKey={(r) => r.id} pageSize={10}
          footerRow={hasTotals ? (
            <tr className="bg-soft/70 font-bold">
              {keys.map((k, i) => <td key={k} className={'whitespace-nowrap px-4 py-3 tnum ' + (isNum(k) ? 'text-right' : 'text-left')}>{totalCell(k, i)}</td>)}
            </tr>
          ) : undefined}
        />
      </Card>

      {/* In print: the complete table, every row, header repeated on each page */}
      <div className="hidden print:block">
        <h3 className="mb-2 font-display text-sm font-bold">Report data <span className="font-sans text-[11px] font-medium text-mute">({rep.rows.length} rows)</span></h3>
        <table className="print-table w-full border-collapse">
          <thead><tr>{keys.map((k) => <th key={k} className={th + (isNum(k) ? ' text-right' : ' text-left')}>{tidy(k)}</th>)}</tr></thead>
          <tbody>
            {rep.rows.map((r, ri) => (
              <tr key={r.id} className={ri % 2 ? 'bg-soft/60' : ''}>
                {keys.map((k) => <td key={k} className={td + (isNum(k) ? ' text-right tnum' : ' text-left')}>{fmtCell(k, r[k])}</td>)}
              </tr>
            ))}
          </tbody>
          {hasTotals && <tfoot><tr className="bg-soft font-bold">{keys.map((k, i) => <td key={k} className={td + ' font-bold' + (isNum(k) ? ' text-right tnum' : ' text-left')}>{totalCell(k, i)}</td>)}</tr></tfoot>}
        </table>
        <p className="mt-2 text-center text-[10px] leading-none text-mute">{settings.plant} · SmartX ERP · {rep.title} · generated {generated}</p>
      </div>
    </div>
  );
};

export default Reports;
