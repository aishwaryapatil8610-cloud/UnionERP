import type * as React from 'react';
import { ListPage } from '../components/ListPage';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { inr, nf, todayISO } from '../lib/format';
import type { Purchase } from '../types';

const NEXT: Record<Purchase['status'], Purchase['status'] | null> = { Ordered: 'Received', Received: 'Paid', Paid: null };

const Purchases: React.FC = () => {
  const { db, add, patch } = useData();
  const toast = useToast();
  const items = db.items.filter((i) => i.category !== 'Product').map((i) => i.name);
  return (
    <ListPage<Purchase>
      title="Purchases"
      subtitle="Purchase orders to vendors for feed, packing, chemicals and fuel."
      rows={db.purchases}
      csvName="purchases"
      addLabel="New purchase order"
      stats={[
        { label: 'Orders', value: String(db.purchases.length) },
        { label: 'Order value', value: inr(db.purchases.reduce((s, p) => s + p.amount, 0)) },
        { label: 'Awaiting delivery', value: String(db.purchases.filter((p) => p.status === 'Ordered').length), tone: 'text-warn' },
        { label: 'To pay', value: inr(db.purchases.filter((p) => p.status === 'Received').reduce((s, p) => s + p.amount, 0)), tone: 'text-danger' },
      ]}
      filter={{ label: 'Status', get: (r) => r.status, options: ['Ordered', 'Received', 'Paid'] }}
      fields={[
        { key: 'vendor', label: 'Vendor' },
        { key: 'item', label: 'Item', type: 'select', options: items },
        { key: 'qty', label: 'Quantity', type: 'number' },
        { key: 'rate', label: 'Rate (INR)', type: 'number' },
      ]}
      onAdd={(v) => { const qty = Number(v.qty), rate = Number(v.rate); add('purchases', { id: 'PO' + (301 + db.purchases.length), date: todayISO(), vendor: v.vendor, item: v.item, qty, unit: db.items.find((i) => i.name === v.item)?.unit ?? 'pcs', rate, amount: qty * rate, status: 'Ordered' }); }}
      columns={[
        { key: 'id', header: 'PO', cell: (r) => <span className="font-semibold">{r.id}</span>, sort: (r) => r.id },
        { key: 'date', header: 'Date', cell: (r) => r.date, sort: (r) => r.date },
        { key: 'vendor', header: 'Vendor', cell: (r) => r.vendor },
        { key: 'item', header: 'Item', cell: (r) => r.item },
        { key: 'qty', header: 'Qty', align: 'right', cell: (r) => nf(r.qty) + ' ' + r.unit },
        { key: 'amt', header: 'Amount', align: 'right', cell: (r) => <span className="font-bold">{inr(r.amount)}</span>, sort: (r) => r.amount },
        { key: 'st', header: 'Status', cell: (r) => <Badge dot tone={r.status === 'Paid' ? 'ok' : r.status === 'Received' ? 'brand' : 'warn'}>{r.status}</Badge> },
        { key: 'act', header: '', align: 'right', cell: (r) => { const n = NEXT[r.status]; return n ? <Button size="sm" variant="soft" onClick={() => { patch('purchases', r.id, { status: n }); toast(r.id + ': ' + n); }}>Mark {n.toLowerCase()}</Button> : null; } },
      ]}
    />
  );
};

export default Purchases;
