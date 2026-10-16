import type * as React from 'react';
import { useMemo } from 'react';
import { Radio } from 'lucide-react';
import { ListPage } from '../components/ListPage';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { inr, nf, todayISO } from '../lib/format';
import { rateOf } from '../lib/data';
import type { Collection as C } from '../types';

type Row = C & { name: string };

const Collection: React.FC = () => {
  const { db, add, nextId } = useData();
  const toast = useToast();
  const byId = useMemo(() => new Map(db.farmers.map((f) => [f.id, f])), [db.farmers]);
  const rows: Row[] = useMemo(() => [...db.collections].reverse().map((c) => ({ ...c, name: byId.get(c.farmerId)?.name ?? c.farmerId })), [db.collections, byId]);
  const today = db.collections.filter((c) => c.date === todayISO());
  const litres = today.reduce((s, c) => s + c.qty, 0);
  const amount = today.reduce((s, c) => s + c.amount, 0);

  const simulate = () => {
    const f = db.farmers[Math.floor(Math.random() * db.farmers.length)];
    const qty = Math.round((3 + Math.random() * 14) * 100) / 100;
    const fat = Math.round((f.milk === 'Buffalo' ? 6 + Math.random() * 1.5 : 3.6 + Math.random() * 1.2) * 100) / 100;
    const snf = Math.round((8.2 + Math.random() * 0.8) * 100) / 100;
    const rate = rateOf(fat, snf);
    const now = new Date();
    add('collections', { id: nextId('C'), date: todayISO(), shift: now.getHours() < 12 ? 'Morning' : 'Evening', time: now.toTimeString().slice(0, 5), farmerId: f.id, centre: f.centre, qty, fat, snf, rate, amount: Math.round(qty * rate * 100) / 100 });
    toast(f.name + ': ' + qty + ' L, fat ' + fat + ', SNF ' + snf);
  };

  return (
    <ListPage<Row>
      title="Machine collection"
      subtitle="Farmer-wise litres, fat and SNF as recorded by the analyser and weighing machine at the centre."
      rows={rows}
      csvName="machine-collection"
      stats={[
        { label: 'Litres today', value: nf(litres, 1), tone: 'text-brand' },
        { label: 'Farmers today', value: String(new Set(today.map((c) => c.farmerId)).size) },
        { label: 'Value today', value: inr(amount) },
        { label: 'Avg fat today', value: today.length ? (today.reduce((s, c) => s + c.fat, 0) / today.length).toFixed(2) : '-' },
      ]}
      filter={{ label: 'Shift', get: (r) => r.shift, options: ['Morning', 'Evening'] }}
      actions={<Button variant="soft" icon={<Radio size={16} />} onClick={simulate}>Simulate machine entry</Button>}
      columns={[
        { key: 'date', header: 'Date', cell: (r) => r.date + ' ' + r.time, sort: (r) => r.date + r.time },
        { key: 'farmer', header: 'Farmer', cell: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-xs text-mute">{r.farmerId}</p></div>, sort: (r) => r.name },
        { key: 'shift', header: 'Shift', cell: (r) => <Badge tone={r.shift === 'Morning' ? 'warn' : 'brand'}>{r.shift}</Badge> },
        { key: 'centre', header: 'Centre', cell: (r) => r.centre },
        { key: 'qty', header: 'Litres', align: 'right', cell: (r) => r.qty.toFixed(2), sort: (r) => r.qty },
        { key: 'fat', header: 'Fat', align: 'right', cell: (r) => r.fat.toFixed(2), sort: (r) => r.fat },
        { key: 'snf', header: 'SNF', align: 'right', cell: (r) => r.snf.toFixed(2), sort: (r) => r.snf },
        { key: 'rate', header: 'Rate', align: 'right', cell: (r) => inr(r.rate, 2) },
        { key: 'amt', header: 'Amount', align: 'right', cell: (r) => <span className="font-bold">{inr(r.amount, 2)}</span>, sort: (r) => r.amount },
      ]}
    />
  );
};

export default Collection;
