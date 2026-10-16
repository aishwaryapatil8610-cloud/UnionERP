import type * as React from 'react';
import { ListPage } from '../components/ListPage';
import { Badge } from '../components/ui/Badge';
import { useData } from '../context/DataContext';
import { inr } from '../lib/format';
import type { Customer } from '../types';

const Customers: React.FC = () => {
  const { db, add, nextId } = useData();
  const out = db.customers.reduce((s, c) => s + c.outstanding, 0);
  return (
    <ListPage<Customer>
      title="Customers"
      subtitle="Shops, hotels, distributors and institutions with credit limit and outstanding."
      rows={db.customers}
      csvName="customers"
      addLabel="Add customer"
      stats={[
        { label: 'Customers', value: String(db.customers.length) },
        { label: 'Credit given', value: inr(db.customers.reduce((s, c) => s + c.creditLimit, 0)) },
        { label: 'Outstanding', value: inr(out), tone: 'text-warn' },
        { label: 'Over limit', value: String(db.customers.filter((c) => c.outstanding > c.creditLimit).length), tone: 'text-danger' },
      ]}
      filter={{ label: 'Type', get: (r) => r.kind, options: ['Retail', 'Hotel', 'Distributor', 'Institution'] }}
      fields={[
        { key: 'name', label: 'Customer name' },
        { key: 'kind', label: 'Type', type: 'select', options: ['Retail', 'Hotel', 'Distributor', 'Institution'] },
        { key: 'city', label: 'City' },
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'creditLimit', label: 'Credit limit (INR)', type: 'number' },
      ]}
      onAdd={(v) => add('customers', { id: nextId('CU'), name: v.name, kind: v.kind as Customer['kind'], city: v.city, phone: v.phone, creditLimit: Number(v.creditLimit), outstanding: 0 })}
      columns={[
        { key: 'name', header: 'Customer', cell: (r) => <span className="font-semibold">{r.name}</span>, sort: (r) => r.name },
        { key: 'kind', header: 'Type', cell: (r) => <Badge>{r.kind}</Badge> },
        { key: 'city', header: 'City', cell: (r) => r.city },
        { key: 'phone', header: 'Phone', cell: (r) => r.phone },
        { key: 'limit', header: 'Credit limit', align: 'right', cell: (r) => inr(r.creditLimit), sort: (r) => r.creditLimit },
        { key: 'out', header: 'Outstanding', align: 'right', cell: (r) => <span className={r.outstanding > r.creditLimit ? 'font-bold text-danger' : ''}>{inr(r.outstanding)}</span>, sort: (r) => r.outstanding },
        { key: 'st', header: 'Credit', cell: (r) => <Badge dot tone={r.outstanding > r.creditLimit ? 'danger' : 'ok'}>{r.outstanding > r.creditLimit ? 'Over limit' : 'Within limit'}</Badge> },
      ]}
    />
  );
};

export default Customers;
