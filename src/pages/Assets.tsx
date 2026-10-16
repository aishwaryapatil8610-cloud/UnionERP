import type * as React from 'react';
import { ListPage } from '../components/ListPage';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { todayISO } from '../lib/format';
import type { Asset } from '../types';

const Assets: React.FC = () => {
  const { db, patch } = useData();
  const toast = useToast();
  const count = (s: Asset['status']) => String(db.assets.filter((a) => a.status === s).length);
  return (
    <ListPage<Asset>
      title="Assets and service"
      subtitle="Plant machines with next service date and condition."
      rows={db.assets}
      csvName="assets"
      stats={[
        { label: 'Machines', value: String(db.assets.length) },
        { label: 'Working', value: count('Working'), tone: 'text-ok' },
        { label: 'Due service', value: count('Due service'), tone: 'text-warn' },
        { label: 'Down', value: count('Down'), tone: 'text-danger' },
      ]}
      filter={{ label: 'Status', get: (r) => r.status, options: ['Working', 'Due service', 'Down'] }}
      columns={[
        { key: 'name', header: 'Machine', cell: (r) => <span className="font-semibold">{r.name}</span>, sort: (r) => r.name },
        { key: 'cat', header: 'Category', cell: (r) => <Badge>{r.category}</Badge> },
        { key: 'loc', header: 'Location', cell: (r) => r.location },
        { key: 'next', header: 'Next service', cell: (r) => <span className={r.nextService < todayISO() ? 'font-bold text-danger' : ''}>{r.nextService}</span>, sort: (r) => r.nextService },
        { key: 'st', header: 'Status', cell: (r) => <Badge dot tone={r.status === 'Working' ? 'ok' : r.status === 'Down' ? 'danger' : 'warn'}>{r.status}</Badge> },
        { key: 'act', header: '', align: 'right', cell: (r) => (r.status !== 'Working' ? <Button size="sm" variant="soft" onClick={() => { patch('assets', r.id, { status: 'Working' }); toast(r.name + ' is working again'); }}>Mark fixed</Button> : null) },
      ]}
    />
  );
};

export default Assets;
