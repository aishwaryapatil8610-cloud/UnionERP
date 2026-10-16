import type * as React from 'react';
import { LogOut } from 'lucide-react';
import { ListPage } from '../components/ListPage';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { todayISO } from '../lib/format';
import type { Gate as G, GateType } from '../types';

const TYPES: GateType[] = ['Milk tanker in', 'Milk tanker out', 'Cattle feed / goods', 'Staff vehicle', 'Visitor'];
const hhmm = () => new Date().toTimeString().slice(0, 5);

const Gate: React.FC = () => {
  const { db, add, patch, nextId } = useData();
  const toast = useToast();
  const inside = db.gate.filter((g) => g.status === 'Inside').length;
  return (
    <ListPage<G>
      title="Gate entry"
      subtitle="Every vehicle and visitor entering or leaving the plant is recorded here."
      rows={db.gate}
      csvName="gate-register"
      addLabel="New gate entry"
      stats={[
        { label: 'Inside now', value: String(inside), tone: 'text-brand' },
        { label: 'Entries listed', value: String(db.gate.length) },
        { label: 'Milk tankers in', value: String(db.gate.filter((g) => g.type === 'Milk tanker in').length) },
        { label: 'Visitors', value: String(db.gate.filter((g) => g.type === 'Visitor').length) },
      ]}
      filter={{ label: 'Status', get: (r) => r.status, options: ['Inside', 'Exited'] }}
      fields={[
        { key: 'vehicle', label: 'Vehicle number' },
        { key: 'driver', label: 'Driver / visitor name' },
        { key: 'type', label: 'Type', type: 'select', options: TYPES },
        { key: 'party', label: 'Party / supplier' },
        { key: 'purpose', label: 'Purpose' },
      ]}
      onAdd={(v) => add('gate', { id: nextId('G'), date: todayISO(), timeIn: hhmm(), timeOut: '-', vehicle: v.vehicle.toUpperCase(), driver: v.driver, type: v.type as GateType, party: v.party, purpose: v.purpose, status: 'Inside' })}
      columns={[
        { key: 'vehicle', header: 'Vehicle', cell: (r) => <span className="font-semibold">{r.vehicle}</span>, sort: (r) => r.vehicle },
        { key: 'driver', header: 'Driver', cell: (r) => r.driver },
        { key: 'type', header: 'Type', cell: (r) => <Badge tone={r.type.startsWith('Milk') ? 'brand' : 'neutral'}>{r.type}</Badge> },
        { key: 'party', header: 'Party', cell: (r) => r.party },
        { key: 'purpose', header: 'Purpose', cell: (r) => r.purpose },
        { key: 'in', header: 'In', cell: (r) => r.timeIn, sort: (r) => r.date + r.timeIn },
        { key: 'out', header: 'Out', cell: (r) => r.timeOut },
        { key: 'status', header: 'Status', cell: (r) => <Badge dot tone={r.status === 'Inside' ? 'warn' : 'ok'}>{r.status}</Badge> },
        {
          key: 'act', header: '', align: 'right',
          cell: (r) => r.status === 'Inside' ? (
            <Button size="sm" variant="soft" icon={<LogOut size={14} />} onClick={() => { patch('gate', r.id, { status: 'Exited', timeOut: hhmm() }); toast(r.vehicle + ' marked exited'); }}>Mark exit</Button>
          ) : null,
        },
      ]}
    />
  );
};

export default Gate;
