import type * as React from 'react';
import { ListPage } from '../components/ListPage';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { nf, todayISO } from '../lib/format';
import type { Production as P } from '../types';

const PRODUCTS = ['Pasteurised milk', 'Curd (dahi)', 'Paneer', 'Ghee', 'Butter', 'Buttermilk'];
const UNIT: Record<string, string> = { 'Pasteurised milk': 'L', Buttermilk: 'L' };
const NEXT: Record<P['status'], P['status'] | null> = { Planned: 'In progress', 'In progress': 'Completed', Completed: null };
const tone = (s: P['status']) => (s === 'Completed' ? 'ok' : s === 'In progress' ? 'brand' : 'neutral');

const Production: React.FC = () => {
  const { db, add, patch, nextId } = useData();
  const toast = useToast();
  const done = db.production.filter((p) => p.status === 'Completed');
  const milk = db.production.reduce((s, p) => s + p.milkIn, 0);
  return (
    <ListPage<P>
      title="Production"
      subtitle="Batches of milk, curd, paneer, ghee and butter with milk used and finished output."
      rows={db.production}
      csvName="production"
      addLabel="New batch"
      stats={[
        { label: 'Batches', value: String(db.production.length) },
        { label: 'Milk used (L)', value: nf(milk) },
        { label: 'Completed', value: String(done.length), tone: 'text-ok' },
        { label: 'Running now', value: String(db.production.filter((p) => p.status === 'In progress').length), tone: 'text-brand' },
      ]}
      filter={{ label: 'Product', get: (r) => r.product, options: PRODUCTS }}
      fields={[
        { key: 'product', label: 'Product', type: 'select', options: PRODUCTS },
        { key: 'milkIn', label: 'Milk to use (litres)', type: 'number' },
      ]}
      onAdd={(v) => add('production', { id: nextId('P'), date: todayISO(), batch: 'B' + (2700 + db.production.length), product: v.product, milkIn: Number(v.milkIn), output: 0, unit: UNIT[v.product] ?? 'kg', status: 'Planned' })}
      columns={[
        { key: 'date', header: 'Date', cell: (r) => r.date, sort: (r) => r.date },
        { key: 'batch', header: 'Batch', cell: (r) => <span className="font-semibold">{r.batch}</span> },
        { key: 'product', header: 'Product', cell: (r) => r.product },
        { key: 'in', header: 'Milk in (L)', align: 'right', cell: (r) => nf(r.milkIn), sort: (r) => r.milkIn },
        { key: 'out', header: 'Output', align: 'right', cell: (r) => (r.output ? nf(r.output) + ' ' + r.unit : '-') },
        { key: 'yield', header: 'Yield %', align: 'right', cell: (r) => (r.output ? ((r.output / r.milkIn) * 100).toFixed(1) : '-') },
        { key: 'status', header: 'Status', cell: (r) => <Badge dot tone={tone(r.status)}>{r.status}</Badge> },
        { key: 'act', header: '', align: 'right', cell: (r) => { const n = NEXT[r.status]; return n ? <Button size="sm" variant="soft" onClick={() => { patch('production', r.id, n === 'Completed' ? { status: n, output: Math.round(r.milkIn * (r.unit === 'L' ? 0.96 : 0.1)) } : { status: n }); toast(r.batch + ': ' + n); }}>{n === 'Completed' ? 'Complete' : 'Start'}</Button> : null; } },
      ]}
    />
  );
};

export default Production;
