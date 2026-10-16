import type * as React from 'react';
import { ListPage } from '../components/ListPage';
import { Badge } from '../components/ui/Badge';
import { useData } from '../context/DataContext';
import type { Vehicle } from '../types';

const tone = (s: Vehicle['status']) => (s === 'Running' ? 'ok' : s === 'Idle' ? 'neutral' : 'danger');

const Fleet: React.FC = () => {
  const { db, add, nextId } = useData();
  const count = (s: Vehicle['status']) => String(db.vehicles.filter((v) => v.status === s).length);
  return (
    <ListPage<Vehicle>
      title="Fleet"
      subtitle="Milk tankers, vans, drivers and the routes they serve."
      rows={db.vehicles}
      csvName="fleet"
      addLabel="Add vehicle"
      stats={[
        { label: 'Vehicles', value: String(db.vehicles.length) },
        { label: 'Running', value: count('Running'), tone: 'text-ok' },
        { label: 'Idle', value: count('Idle') },
        { label: 'In maintenance', value: count('Maintenance'), tone: 'text-danger' },
      ]}
      filter={{ label: 'Status', get: (r) => r.status, options: ['Running', 'Idle', 'Maintenance'] }}
      fields={[
        { key: 'no', label: 'Vehicle number' },
        { key: 'type', label: 'Type', type: 'select', options: ['Insulated tanker 10KL', 'Tanker 6KL', 'Pickup van'] },
        { key: 'driver', label: 'Driver' },
        { key: 'route', label: 'Route' },
        { key: 'status', label: 'Status', type: 'select', options: ['Running', 'Idle', 'Maintenance'] },
      ]}
      onAdd={(v) => add('vehicles', { id: nextId('VH'), no: v.no.toUpperCase(), type: v.type, driver: v.driver, route: v.route, status: v.status as Vehicle['status'] })}
      columns={[
        { key: 'no', header: 'Vehicle', cell: (r) => <span className="font-semibold">{r.no}</span>, sort: (r) => r.no },
        { key: 'type', header: 'Type', cell: (r) => r.type },
        { key: 'driver', header: 'Driver', cell: (r) => r.driver },
        { key: 'route', header: 'Route', cell: (r) => r.route },
        { key: 'status', header: 'Status', cell: (r) => <Badge dot tone={tone(r.status)}>{r.status}</Badge> },
      ]}
    />
  );
};

export default Fleet;
