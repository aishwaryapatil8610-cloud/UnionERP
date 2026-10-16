import type * as React from 'react';
import { ListPage } from '../components/ListPage';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { inr, nf, todayISO } from '../lib/format';
import type { Sale } from '../types';

const Sales: React.FC = () => {
  const { db, add, patch } = useData();
  const toast = useToast();
  const total = db.sales.reduce((s, x) => s + x.amount, 0);
  const due = db.sales.filter((x) => !x.paid).reduce((s, x) => s + x.amount, 0);
  const products = db.items.filter((i) => i.category === 'Product').map((i) => i.name);
  return (
    <ListPage<Sale>
      title="Sales"
      subtitle="Product and milk sales to shops, hotels and booths, with outstanding amounts."
      rows={db.sales}
      csvName="sales"
      addLabel="New sale"
      stats={[
        { label: 'Invoices', value: String(db.sales.length) },
        { label: 'Total sales', value: inr(total) },
        { label: 'Outstanding', value: inr(due), tone: 'text-warn' },
        { label: 'Collected', value: inr(total - due), tone: 'text-ok' },
      ]}
      filter={{ label: 'Payment', get: (r) => (r.paid ? 'Paid' : 'Unpaid'), options: ['Paid', 'Unpaid'] }}
      fields={[
        { key: 'customer', label: 'Customer' },
        { key: 'product', label: 'Product', type: 'select', options: products },
        { key: 'qty', label: 'Quantity', type: 'number' },
        { key: 'rate', label: 'Rate (INR)', type: 'number' },
        { key: 'paid', label: 'Payment', type: 'select', options: ['Unpaid', 'Paid'] },
      ]}
      onAdd={(v) => {
        const qty = Number(v.qty), rate = Number(v.rate);
        const unit = db.items.find((i) => i.name === v.product)?.unit ?? 'kg';
        add('sales', { id: 'SL' + (501 + db.sales.length), date: todayISO(), customer: v.customer, product: v.product, qty, unit, rate, amount: qty * rate, paid: v.paid === 'Paid' });
      }}
      columns={[
        { key: 'id', header: 'Invoice', cell: (r) => <span className="font-semibold">{r.id}</span>, sort: (r) => r.id },
        { key: 'date', header: 'Date', cell: (r) => r.date, sort: (r) => r.date },
        { key: 'cust', header: 'Customer', cell: (r) => r.customer },
        { key: 'prod', header: 'Product', cell: (r) => r.product },
        { key: 'qty', header: 'Qty', align: 'right', cell: (r) => nf(r.qty) + ' ' + r.unit },
        { key: 'rate', header: 'Rate', align: 'right', cell: (r) => inr(r.rate) },
        { key: 'amt', header: 'Amount', align: 'right', cell: (r) => <span className="font-bold">{inr(r.amount)}</span>, sort: (r) => r.amount },
        { key: 'paid', header: 'Payment', cell: (r) => <Badge dot tone={r.paid ? 'ok' : 'warn'}>{r.paid ? 'Paid' : 'Unpaid'}</Badge> },
        { key: 'act', header: '', align: 'right', cell: (r) => (r.paid ? null : <Button size="sm" variant="soft" onClick={() => { patch('sales', r.id, { paid: true }); toast(r.id + ' marked paid'); }}>Mark paid</Button>) },
      ]}
    />
  );
};

export default Sales;
