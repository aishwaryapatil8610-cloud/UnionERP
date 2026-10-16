import type * as React from 'react';
import { ListPage } from '../components/ListPage';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { inr, todayISO } from '../lib/format';
import type { Service } from '../types';

const KINDS = ['Vaccination', 'Artificial insemination', 'Health check', 'Deworming'];

const Services: React.FC = () => {
  const { db, add, patch, nextId } = useData();
  const toast = useToast();
  return (
    <ListPage<Service>
      title="Farmer services"
      subtitle="Vet visits, vaccination, artificial insemination and health checks for member farmers."
      rows={db.services}
      csvName="farmer-services"
      addLabel="Book a visit"
      stats={[
        { label: 'Visits', value: String(db.services.length) },
        { label: 'Scheduled', value: String(db.services.filter((s) => s.status === 'Scheduled').length), tone: 'text-brand' },
        { label: 'Done', value: String(db.services.filter((s) => s.status === 'Done').length), tone: 'text-ok' },
        { label: 'Service charges', value: inr(db.services.reduce((s, x) => s + x.charge, 0)) },
      ]}
      filter={{ label: 'Service', get: (r) => r.kind, options: KINDS }}
      fields={[
        { key: 'farmer', label: 'Farmer', type: 'select', options: db.farmers.map((f) => f.name) },
        { key: 'kind', label: 'Service', type: 'select', options: KINDS },
        { key: 'animal', label: 'Animal tag' },
        { key: 'vet', label: 'Veterinarian', type: 'select', options: ['Dr. Kadam', 'Dr. Joshi', 'Dr. Gaikwad'] },
        { key: 'charge', label: 'Charge (INR)', type: 'number', value: '0' },
        { key: 'date', label: 'Visit date', type: 'date', value: todayISO() },
      ]}
      onAdd={(v) => add('services', { id: nextId('SV'), date: v.date, farmer: v.farmer, kind: v.kind as Service['kind'], animal: v.animal, vet: v.vet, charge: Number(v.charge), status: 'Scheduled' })}
      columns={[
        { key: 'date', header: 'Date', cell: (r) => r.date, sort: (r) => r.date },
        { key: 'farmer', header: 'Farmer', cell: (r) => <span className="font-semibold">{r.farmer}</span> },
        { key: 'kind', header: 'Service', cell: (r) => <Badge tone="brand">{r.kind}</Badge> },
        { key: 'animal', header: 'Animal', cell: (r) => r.animal },
        { key: 'vet', header: 'Vet', cell: (r) => r.vet },
        { key: 'charge', header: 'Charge', align: 'right', cell: (r) => inr(r.charge) },
        { key: 'st', header: 'Status', cell: (r) => <Badge dot tone={r.status === 'Done' ? 'ok' : 'warn'}>{r.status}</Badge> },
        { key: 'act', header: '', align: 'right', cell: (r) => (r.status === 'Scheduled' ? <Button size="sm" variant="soft" onClick={() => { patch('services', r.id, { status: 'Done' }); toast('Visit marked done'); }}>Mark done</Button> : null) },
      ]}
    />
  );
};

export default Services;
