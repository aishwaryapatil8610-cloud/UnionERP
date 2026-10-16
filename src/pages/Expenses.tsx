import type * as React from 'react';
import { ListPage } from '../components/ListPage';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { inr, todayISO } from '../lib/format';
import type { Expense } from '../types';

const HEADS = ['Electricity', 'Diesel', 'Repairs', 'Tea and canteen', 'Lab consumables', 'Transport', 'Stationery'];

const Expenses: React.FC = () => {
  const { db, add, patch } = useData();
  const toast = useToast();
  const pending = db.expenses.filter((e) => e.status === 'Pending');
  return (
    <ListPage<Expense>
      title="Expenses"
      subtitle="Daily plant expenses with approval by the manager."
      rows={db.expenses}
      csvName="expenses"
      addLabel="New expense"
      stats={[
        { label: 'Entries', value: String(db.expenses.length) },
        { label: 'Total spend', value: inr(db.expenses.reduce((s, e) => s + e.amount, 0)) },
        { label: 'Awaiting approval', value: String(pending.length), tone: 'text-warn' },
        { label: 'Pending amount', value: inr(pending.reduce((s, e) => s + e.amount, 0)), tone: 'text-danger' },
      ]}
      filter={{ label: 'Status', get: (r) => r.status, options: ['Pending', 'Approved'] }}
      fields={[
        { key: 'head', label: 'Expense head', type: 'select', options: HEADS },
        { key: 'note', label: 'Description' },
        { key: 'amount', label: 'Amount (INR)', type: 'number' },
        { key: 'mode', label: 'Paid by', type: 'select', options: ['Cash', 'Bank', 'UPI'] },
      ]}
      onAdd={(v) => add('expenses', { id: 'EX' + (701 + db.expenses.length), date: todayISO(), head: v.head, note: v.note, amount: Number(v.amount), mode: v.mode as Expense['mode'], status: 'Pending' })}
      columns={[
        { key: 'id', header: 'Ref', cell: (r) => <span className="font-semibold">{r.id}</span>, sort: (r) => r.id },
        { key: 'date', header: 'Date', cell: (r) => r.date, sort: (r) => r.date },
        { key: 'head', header: 'Head', cell: (r) => r.head },
        { key: 'note', header: 'Description', cell: (r) => r.note },
        { key: 'mode', header: 'Mode', cell: (r) => <Badge>{r.mode}</Badge> },
        { key: 'amt', header: 'Amount', align: 'right', cell: (r) => <span className="font-bold">{inr(r.amount)}</span>, sort: (r) => r.amount },
        { key: 'st', header: 'Status', cell: (r) => <Badge dot tone={r.status === 'Approved' ? 'ok' : 'warn'}>{r.status}</Badge> },
        { key: 'act', header: '', align: 'right', cell: (r) => (r.status === 'Pending' ? <Button size="sm" variant="soft" onClick={() => { patch('expenses', r.id, { status: 'Approved' }); toast(r.id + ' approved'); }}>Approve</Button> : null) },
      ]}
    />
  );
};

export default Expenses;
