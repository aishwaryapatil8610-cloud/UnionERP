import type * as React from 'react';
import { useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type Column } from '../components/ui/DataTable';
import { ChartTip } from '../components/ChartTip';
import { useData } from '../context/DataContext';
import { useChartColors } from '../context/ThemeContext';
import { addDays, fmtShort, todayISO } from '../lib/format';

interface Alert { id: string; when: string; who: string; issue: string; value: string }

const Quality: React.FC = () => {
  const { db, settings } = useData();
  const col = useChartColors();
  const daily = useMemo(() => {
    const m = new Map<string, { fat: number; snf: number; n: number }>();
    db.collections.forEach((c) => { const x = m.get(c.date) ?? { fat: 0, snf: 0, n: 0 }; x.fat += c.fat; x.snf += c.snf; x.n++; m.set(c.date, x); });
    return [...m.entries()].sort().map(([d, x]) => ({ date: d, fat: +(x.fat / x.n).toFixed(2), snf: +(x.snf / x.n).toFixed(2) }));
  }, [db.collections]);

  const alerts: Alert[] = useMemo(() => {
    const from = addDays(todayISO(), -2);
    const byId = new Map(db.farmers.map((f) => [f.id, f.name]));
    const low = db.collections.filter((c) => c.date >= from && (c.fat < settings.minFat || c.snf < settings.minSnf)).map((c) => ({ id: c.id, when: c.date + ' ' + c.time, who: byId.get(c.farmerId) ?? c.farmerId, issue: c.snf < settings.minSnf ? 'Low SNF' : 'Low fat', value: 'Fat ' + c.fat + ' / SNF ' + c.snf }));
    const rej = db.reception.filter((r) => r.status === 'Rejected').map((r) => ({ id: r.id, when: r.date, who: r.tanker, issue: 'Tanker rejected', value: 'Temp ' + r.temp + ' / Acidity ' + r.acidity }));
    return [...rej, ...low].slice(0, 60);
  }, [db, settings]);

  const rejRate = db.reception.length ? (db.reception.filter((r) => r.status === 'Rejected').length / db.reception.length) * 100 : 0;
  const last = daily[daily.length - 1];

  const columns: Column<Alert>[] = [
    { key: 'when', header: 'When', cell: (r) => r.when, sort: (r) => r.when },
    { key: 'who', header: 'Farmer / tanker', cell: (r) => <span className="font-semibold">{r.who}</span> },
    { key: 'issue', header: 'Issue', cell: (r) => <Badge tone={r.issue === 'Tanker rejected' ? 'danger' : 'warn'} dot>{r.issue}</Badge> },
    { key: 'v', header: 'Reading', cell: (r) => r.value },
  ];

  return (
    <div>
      <PageHeader title="Quality lab" subtitle={'Alerts use your limits: fat below ' + settings.minFat + ' or SNF below ' + settings.minSnf + '.'} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[['Latest avg fat', last ? last.fat.toFixed(2) : '-'], ['Latest avg SNF', last ? last.snf.toFixed(2) : '-'], ['Tanker rejection', rejRate.toFixed(1) + '%'], ['Open alerts', String(alerts.length)]].map(([l, v]) => (
          <Card key={l} className="p-4 sm:p-5"><p className="text-xs font-semibold uppercase tracking-wider text-mute">{l}</p><p className="mt-1 font-display text-2xl font-extrabold tnum sm:text-3xl">{v}</p></Card>
        ))}
      </div>
      <Card className="mb-5">
        <CardHeader title="Daily average fat and SNF" subtitle="Last 14 days of machine collection" />
        <div className="h-72 px-2 pb-4 pt-2 sm:px-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
              <CartesianGrid stroke={col.grid} vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtShort} tick={{ fill: col.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[3, 10]} tick={{ fill: col.tick, fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={<ChartTip title={(l) => fmtShort(String(l))} />} />
              <Legend />
              <Line type="monotone" dataKey="fat" name="Fat %" stroke={col.brand} strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="snf" name="SNF %" stroke="#5668B8" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <CardHeader title="Alerts" subtitle="Rejected tankers and low readings from the last 3 days" />
        <DataTable columns={columns} rows={alerts} rowKey={(r) => r.id} pageSize={10} />
      </Card>
    </div>
  );
};

export default Quality;
