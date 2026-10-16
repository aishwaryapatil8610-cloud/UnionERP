import type * as React from 'react';
import { ListPage } from '../components/ListPage';
import { Badge } from '../components/ui/Badge';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { nf, todayISO } from '../lib/format';
import { SILO_NAMES } from '../lib/data';
import type { Reception as R } from '../types';

const tone = (s: R['status']) => (s === 'Accepted' ? 'ok' : s === 'Rejected' ? 'danger' : 'warn');

const Reception: React.FC = () => {
  const { db, add, patch, nextId } = useData();
  const toast = useToast();
  const today = db.reception.filter((r) => r.date === todayISO());
  const acc = db.reception.filter((r) => r.status === 'Accepted');
  const litres = acc.reduce((s, r) => s + r.qty, 0);
  const wavg = (k: 'fat' | 'snf') => (litres ? acc.reduce((s, r) => s + r[k] * r.qty, 0) / litres : 0);

  return (
    <ListPage<R>
      title="Milk reception"
      subtitle="Weigh and test every incoming tanker, accept or reject it, and assign a silo."
      rows={db.reception}
      csvName="milk-reception"
      addLabel="Receive tanker"
      stats={[
        { label: 'Tankers today', value: String(today.length) },
        { label: 'Accepted litres', value: nf(litres), tone: 'text-ok' },
        { label: 'Avg fat %', value: wavg('fat').toFixed(2) },
        { label: 'Avg SNF %', value: wavg('snf').toFixed(2) },
      ]}
      filter={{ label: 'Status', get: (r) => r.status, options: ['Accepted', 'Rejected', 'Pending'] }}
      fields={[
        { key: 'tanker', label: 'Tanker number' },
        { key: 'route', label: 'Route / centre' },
        { key: 'qty', label: 'Quantity (litres)', type: 'number' },
        { key: 'fat', label: 'Fat %', type: 'number', step: '0.01' },
        { key: 'snf', label: 'SNF %', type: 'number', step: '0.01' },
        { key: 'temp', label: 'Temperature (C)', type: 'number', step: '0.1' },
        { key: 'acidity', label: 'Acidity (% LA)', type: 'number', step: '0.01' },
        { key: 'silo', label: 'Unload to silo', type: 'select', options: SILO_NAMES },
        { key: 'status', label: 'Decision', type: 'select', options: ['Accepted', 'Rejected', 'Pending'] },
      ]}
      onAdd={(v) => {
        const status = v.status as R['status'];
        const qty = Number(v.qty);
        add('reception', { id: nextId('R'), date: todayISO(), tanker: v.tanker.toUpperCase(), route: v.route, qty, fat: Number(v.fat), snf: Number(v.snf), temp: Number(v.temp), acidity: Number(v.acidity), silo: status === 'Rejected' ? '-' : v.silo, status });
        if (status === 'Accepted') {
          const s = db.silos.find((x) => x.name === v.silo);
          if (s) { patch('silos', s.id, { level: Math.min(s.capacity, s.level + qty) }); toast(nf(qty) + ' L added to ' + s.name); }
        }
      }}
      columns={[
        { key: 'date', header: 'Date', cell: (r) => r.date, sort: (r) => r.date },
        { key: 'tanker', header: 'Tanker', cell: (r) => <span className="font-semibold">{r.tanker}</span> },
        { key: 'route', header: 'Route', cell: (r) => r.route },
        { key: 'qty', header: 'Litres', align: 'right', cell: (r) => nf(r.qty), sort: (r) => r.qty },
        { key: 'fat', header: 'Fat %', align: 'right', cell: (r) => r.fat.toFixed(2), sort: (r) => r.fat },
        { key: 'snf', header: 'SNF %', align: 'right', cell: (r) => r.snf.toFixed(2), sort: (r) => r.snf },
        { key: 'temp', header: 'Temp C', align: 'right', cell: (r) => <span className={r.temp > 8 ? 'font-bold text-danger' : ''}>{r.temp.toFixed(1)}</span> },
        { key: 'acid', header: 'Acidity', align: 'right', cell: (r) => <span className={r.acidity > 0.16 ? 'font-bold text-danger' : ''}>{r.acidity.toFixed(2)}</span> },
        { key: 'silo', header: 'Silo', cell: (r) => r.silo },
        { key: 'status', header: 'Decision', cell: (r) => <Badge dot tone={tone(r.status)}>{r.status}</Badge> },
      ]}
    />
  );
};

export default Reception;
