import type * as React from 'react';
import { ListPage } from '../components/ListPage';
import { Badge } from '../components/ui/Badge';
import { useData } from '../context/DataContext';
import { inr, nf } from '../lib/format';
import type { Item } from '../types';

const CATS = ['Feed', 'Product', 'Packing', 'Chemical', 'Fuel', 'Equipment', 'Lab'];

const Inventory: React.FC = () => {
  const { db, add, nextId } = useData();
  const low = db.items.filter((i) => i.stock <= i.reorder).length;
  return (
    <ListPage<Item>
      title="Inventory"
      subtitle="Stock of feed, products, packing, chemicals and fuel with reorder alerts."
      rows={db.items}
      csvName="inventory"
      addLabel="Add item"
      stats={[
        { label: 'Items', value: String(db.items.length) },
        { label: 'Low stock', value: String(low), tone: low ? 'text-danger' : 'text-ok' },
        { label: 'Stock value', value: inr(db.items.reduce((s, i) => s + i.stock * i.rate, 0)) },
        { label: 'Categories', value: String(new Set(db.items.map((i) => i.category)).size) },
      ]}
      filter={{ label: 'Category', get: (r) => r.category, options: CATS }}
      fields={[
        { key: 'name', label: 'Item name' },
        { key: 'category', label: 'Category', type: 'select', options: CATS },
        { key: 'stock', label: 'Opening stock', type: 'number' },
        { key: 'unit', label: 'Unit (kg, L, pcs)' },
        { key: 'reorder', label: 'Reorder level', type: 'number' },
        { key: 'rate', label: 'Rate per unit (INR)', type: 'number' },
      ]}
      onAdd={(v) => add('items', { id: nextId('I'), name: v.name, category: v.category, stock: Number(v.stock), unit: v.unit, reorder: Number(v.reorder), rate: Number(v.rate) })}
      columns={[
        { key: 'name', header: 'Item', cell: (r) => <span className="font-semibold">{r.name}</span>, sort: (r) => r.name },
        { key: 'cat', header: 'Category', cell: (r) => <Badge>{r.category}</Badge> },
        { key: 'stock', header: 'In stock', align: 'right', cell: (r) => nf(r.stock) + ' ' + r.unit, sort: (r) => r.stock },
        { key: 're', header: 'Reorder at', align: 'right', cell: (r) => nf(r.reorder) },
        { key: 'rate', header: 'Rate', align: 'right', cell: (r) => inr(r.rate) },
        { key: 'val', header: 'Value', align: 'right', cell: (r) => inr(r.stock * r.rate), sort: (r) => r.stock * r.rate },
        { key: 'st', header: 'Status', cell: (r) => <Badge dot tone={r.stock <= r.reorder ? 'danger' : 'ok'}>{r.stock <= r.reorder ? 'Low' : 'OK'}</Badge> },
      ]}
    />
  );
};

export default Inventory;
