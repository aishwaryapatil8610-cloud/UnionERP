import type * as React from 'react';
import { ListPage } from '../components/ListPage';
import { Badge } from '../components/ui/Badge';
import { useData } from '../context/DataContext';
import { inr } from '../lib/format';
import { CENTRES } from '../lib/data';
import type { Farmer, MilkKind } from '../types';

const Farmers: React.FC = () => {
  const { db, add } = useData();
  return (
    <ListPage<Farmer>
      title="Farmers"
      subtitle="Master list of milk suppliers, their centre, milk type and advance."
      rows={db.farmers}
      csvName="farmers"
      addLabel="Add farmer"
      stats={[
        { label: 'Total farmers', value: String(db.farmers.length) },
        { label: 'Cow', value: String(db.farmers.filter((f) => f.milk === 'Cow').length) },
        { label: 'Buffalo', value: String(db.farmers.filter((f) => f.milk === 'Buffalo').length) },
        { label: 'Advance given', value: inr(db.farmers.reduce((s, f) => s + f.advance, 0)), tone: 'text-warn' },
      ]}
      filter={{ label: 'Centre', get: (r) => r.centre, options: CENTRES }}
      fields={[
        { key: 'name', label: 'Farmer name' },
        { key: 'village', label: 'Village' },
        { key: 'centre', label: 'Centre', type: 'select', options: CENTRES },
        { key: 'milk', label: 'Milk type', type: 'select', options: ['Cow', 'Buffalo', 'Mixed'] },
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'advance', label: 'Advance given (INR)', type: 'number', value: '0' },
      ]}
      onAdd={(v) => add('farmers', { id: 'F' + String(db.farmers.length + 1).padStart(2, '0') + '0', name: v.name, village: v.village, centre: v.centre, milk: v.milk as MilkKind, phone: v.phone, advance: Number(v.advance) || 0 })}
      columns={[
        { key: 'id', header: 'Code', cell: (r) => <span className="font-semibold">{r.id}</span>, sort: (r) => r.id },
        { key: 'name', header: 'Name', cell: (r) => r.name, sort: (r) => r.name },
        { key: 'village', header: 'Village', cell: (r) => r.village },
        { key: 'centre', header: 'Centre', cell: (r) => r.centre },
        { key: 'milk', header: 'Milk', cell: (r) => <Badge tone={r.milk === 'Buffalo' ? 'brand' : r.milk === 'Cow' ? 'warn' : 'neutral'}>{r.milk}</Badge> },
        { key: 'phone', header: 'Phone', cell: (r) => r.phone },
        { key: 'adv', header: 'Advance', align: 'right', cell: (r) => inr(r.advance), sort: (r) => r.advance },
      ]}
    />
  );
};

export default Farmers;
