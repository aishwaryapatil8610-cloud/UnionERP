import type * as React from 'react';
import { ListPage } from '../components/ListPage';
import { Badge } from '../components/ui/Badge';
import { useData } from '../context/DataContext';
import { inr, todayISO } from '../lib/format';
import type { Voucher } from '../types';

const ACCOUNTS = ['Farmer payments', 'Milk sales', 'Cattle feed purchase', 'Diesel & fuel', 'Salary', 'Electricity', 'Packing material', 'Bank interest'];

const Accounting: React.FC = () => {
  const { db, add } = useData();
  const dr = db.vouchers.reduce((s, v) => s + v.debit, 0);
  const cr = db.vouchers.reduce((s, v) => s + v.credit, 0);
  return (
    <ListPage<Voucher>
      title="Accounting"
      subtitle="Vouchers for money received, money paid and adjustments, with a live balance."
      rows={db.vouchers}
      csvName="vouchers"
      addLabel="New voucher"
      stats={[
        { label: 'Vouchers', value: String(db.vouchers.length) },
        { label: 'Total debit (out)', value: inr(dr), tone: 'text-danger' },
        { label: 'Total credit (in)', value: inr(cr), tone: 'text-ok' },
        { label: 'Net balance', value: inr(cr - dr), tone: cr - dr >= 0 ? 'text-ok' : 'text-danger' },
      ]}
      filter={{ label: 'Type', get: (r) => r.type, options: ['Receipt', 'Payment', 'Journal'] }}
      fields={[
        { key: 'type', label: 'Voucher type', type: 'select', options: ['Receipt', 'Payment', 'Journal'] },
        { key: 'account', label: 'Account', type: 'select', options: ACCOUNTS },
        { key: 'amount', label: 'Amount (INR)', type: 'number' },
        { key: 'narration', label: 'Narration' },
      ]}
      onAdd={(v) => {
        const amt = Number(v.amount);
        const type = v.type as Voucher['type'];
        add('vouchers', { id: 'V' + (1001 + db.vouchers.length), date: todayISO(), type, account: v.account, narration: v.narration, debit: type === 'Payment' ? amt : 0, credit: type === 'Payment' ? 0 : amt });
      }}
      columns={[
        { key: 'id', header: 'Voucher', cell: (r) => <span className="font-semibold">{r.id}</span>, sort: (r) => r.id },
        { key: 'date', header: 'Date', cell: (r) => r.date, sort: (r) => r.date },
        { key: 'type', header: 'Type', cell: (r) => <Badge tone={r.type === 'Receipt' ? 'ok' : r.type === 'Payment' ? 'danger' : 'neutral'}>{r.type}</Badge> },
        { key: 'account', header: 'Account', cell: (r) => r.account },
        { key: 'narr', header: 'Narration', cell: (r) => r.narration },
        { key: 'dr', header: 'Debit', align: 'right', cell: (r) => (r.debit ? inr(r.debit) : '-'), sort: (r) => r.debit },
        { key: 'cr', header: 'Credit', align: 'right', cell: (r) => (r.credit ? inr(r.credit) : '-'), sort: (r) => r.credit },
      ]}
    />
  );
};

export default Accounting;
