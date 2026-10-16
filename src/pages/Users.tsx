import type * as React from 'react';
import { ListPage } from '../components/ListPage';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { todayISO } from '../lib/format';
import type { AppUser } from '../types';

const ROLES = ['Plant administrator', 'Plant manager', 'Accountant', 'Lab chemist', 'Gate officer', 'Weighbridge operator', 'Sales executive'];

const Users: React.FC = () => {
  const { db, add, patch, nextId } = useData();
  const toast = useToast();
  return (
    <ListPage<AppUser>
      title="Users and roles"
      subtitle="Who can sign in to SmartX ERP and what role they have."
      rows={db.users}
      csvName="users"
      addLabel="Invite user"
      stats={[
        { label: 'Users', value: String(db.users.length) },
        { label: 'Active', value: String(db.users.filter((u) => u.status === 'Active').length), tone: 'text-ok' },
        { label: 'Disabled', value: String(db.users.filter((u) => u.status === 'Disabled').length), tone: 'text-danger' },
        { label: 'Roles', value: String(new Set(db.users.map((u) => u.role)).size) },
      ]}
      filter={{ label: 'Role', get: (r) => r.role, options: ROLES }}
      fields={[
        { key: 'name', label: 'Full name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role', type: 'select', options: ROLES },
      ]}
      onAdd={(v) => add('users', { id: nextId('U'), name: v.name, email: v.email, role: v.role, status: 'Active', lastLogin: todayISO() })}
      columns={[
        { key: 'name', header: 'User', cell: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-xs text-mute">{r.email}</p></div>, sort: (r) => r.name },
        { key: 'role', header: 'Role', cell: (r) => <Badge tone="brand">{r.role}</Badge> },
        { key: 'last', header: 'Last login', cell: (r) => r.lastLogin, sort: (r) => r.lastLogin },
        { key: 'st', header: 'Status', cell: (r) => <Badge dot tone={r.status === 'Active' ? 'ok' : 'danger'}>{r.status}</Badge> },
        { key: 'act', header: '', align: 'right', cell: (r) => <Button size="sm" variant="soft" onClick={() => { patch('users', r.id, { status: r.status === 'Active' ? 'Disabled' : 'Active' }); toast(r.name + (r.status === 'Active' ? ' disabled' : ' enabled')); }}>{r.status === 'Active' ? 'Disable' : 'Enable'}</Button> },
      ]}
    />
  );
};

export default Users;
