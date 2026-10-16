import type * as React from 'react';
import { ListPage } from '../components/ListPage';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { nf, todayISO } from '../lib/format';
import type { Dispatch as D } from '../types';

const NEXT: Record<D['status'], D['status'] | null> = { Loading: 'On route', 'On route': 'Delivered', Delivered: null };

const Dispatch: React.FC = () => {
  const { db, add, patch, nextId } = useData();
  const toast = useToast();
  return (
    <ListPage<D>
      title="Dispatch"
      subtitle="Milk leaving the plant in tankers. Move each trip from Loading to Delivered."
      rows={db.dispatch}
      csvName="dispatch"
      addLabel="New dispatch"
      stats={[
        { label: 'Trips listed', value: String(db.dispatch.length) },
        { label: 'Loading', value: String(db.dispatch.filter((d) => d.status === 'Loading').length), tone: 'text-warn' },
        { label: 'On route', value: String(db.dispatch.filter((d) => d.status === 'On route').length), tone: 'text-brand' },
        { label: 'Litres sent', value: nf(db.dispatch.reduce((s, d) => s + d.qty, 0)) },
      ]}
      filter={{ label: 'Status', get: (r) => r.status, options: ['Loading', 'On route', 'Delivered'] }}
      fields={[
        { key: 'tanker', label: 'Tanker number' },
        { key: 'to', label: 'Destination' },
        { key: 'qty', label: 'Quantity (litres)', type: 'number' },
        { key: 'fat', label: 'Fat %', type: 'number', step: '0.01' },
        { key: 'snf', label: 'SNF %', type: 'number', step: '0.01' },
      ]}
      onAdd={(v) => add('dispatch', { id: nextId('D'), date: todayISO(), tanker: v.tanker.toUpperCase(), to: v.to, qty: Number(v.qty), fat: Number(v.fat), snf: Number(v.snf), status: 'Loading' })}
      columns={[
        { key: 'date', header: 'Date', cell: (r) => r.date, sort: (r) => r.date },
        { key: 'tanker', header: 'Tanker', cell: (r) => <span className="font-semibold">{r.tanker}</span> },
        { key: 'to', header: 'Destination', cell: (r) => r.to },
        { key: 'qty', header: 'Litres', align: 'right', cell: (r) => nf(r.qty), sort: (r) => r.qty },
        { key: 'fat', header: 'Fat %', align: 'right', cell: (r) => r.fat.toFixed(2) },
        { key: 'snf', header: 'SNF %', align: 'right', cell: (r) => r.snf.toFixed(2) },
        { key: 'status', header: 'Status', cell: (r) => <Badge dot tone={r.status === 'Delivered' ? 'ok' : r.status === 'On route' ? 'brand' : 'warn'}>{r.status}</Badge> },
        {
          key: 'act', header: '', align: 'right',
          cell: (r) => { const n = NEXT[r.status]; return n ? <Button size="sm" variant="soft" onClick={() => { patch('dispatch', r.id, { status: n }); toast(r.tanker + ': ' + n); }}>Mark {n.toLowerCase()}</Button> : null; },
        },
      ]}
    />
  );
};

export default Dispatch;
