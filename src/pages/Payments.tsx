import type * as React from 'react';
import { useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ListPage } from '../components/ListPage';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { addDays, inr, nf, todayISO } from '../lib/format';

interface Row { id: string; name: string; centre: string; litres: number; gross: number; deduction: number; net: number; paid: boolean }

const Payments: React.FC = () => {
  const { db, add, patch } = useData();
  const toast = useToast();
  const [paid, setPaid] = useState<Record<string, { deduction: number; net: number }>>({});

  const rows: Row[] = useMemo(() => {
    const from = addDays(todayISO(), -9);
    return db.farmers.map((f) => {
      const mine = db.collections.filter((c) => c.farmerId === f.id && c.date >= from);
      const litres = mine.reduce((s, c) => s + c.qty, 0);
      const gross = Math.round(mine.reduce((s, c) => s + c.amount, 0));
      const snap = paid[f.id];
      const deduction = snap ? snap.deduction : Math.min(f.advance, Math.round(gross * 0.2));
      return { id: f.id, name: f.name, centre: f.centre, litres, gross, deduction, net: snap ? snap.net : gross - deduction, paid: !!snap };
    });
  }, [db.farmers, db.collections, paid]);

  const pending = rows.filter((r) => !r.paid).reduce((s, r) => s + r.net, 0);
  const done = rows.filter((r) => r.paid).reduce((s, r) => s + r.net, 0);

  const pay = (r: Row) => {
    setPaid((s) => ({ ...s, [r.id]: { deduction: r.deduction, net: r.net } }));
    add('vouchers', { id: 'V' + (1001 + db.vouchers.length), date: todayISO(), type: 'Payment', account: 'Farmer payments', narration: 'Payout to ' + r.name, debit: r.net, credit: 0 });
    const f = db.farmers.find((x) => x.id === r.id);
    if (f && r.deduction) patch('farmers', f.id, { advance: f.advance - r.deduction });
    toast(inr(r.net) + ' paid to ' + r.name);
  };

  return (
    <ListPage<Row>
      title="Farmer payments"
      subtitle="Last 10 days of machine collection, minus advance recovery, ready for payout."
      rows={rows}
      csvName="farmer-payments"
      stats={[
        { label: 'Farmers', value: String(rows.length) },
        { label: 'Litres (10 days)', value: nf(rows.reduce((s, r) => s + r.litres, 0)) },
        { label: 'Pending payout', value: inr(pending), tone: 'text-warn' },
        { label: 'Paid now', value: inr(done), tone: 'text-ok' },
      ]}
      filter={{ label: 'Status', get: (r) => (r.paid ? 'Paid' : 'Pending'), options: ['Pending', 'Paid'] }}
      columns={[
        { key: 'name', header: 'Farmer', cell: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-xs text-mute">{r.id} · {r.centre}</p></div>, sort: (r) => r.name },
        { key: 'l', header: 'Litres', align: 'right', cell: (r) => nf(r.litres, 1), sort: (r) => r.litres },
        { key: 'g', header: 'Gross', align: 'right', cell: (r) => inr(r.gross), sort: (r) => r.gross },
        { key: 'd', header: 'Advance cut', align: 'right', cell: (r) => (r.deduction ? '- ' + inr(r.deduction) : '-') },
        { key: 'n', header: 'Net payable', align: 'right', cell: (r) => <span className="font-bold">{inr(r.net)}</span>, sort: (r) => r.net },
        { key: 's', header: 'Status', cell: (r) => <Badge dot tone={r.paid ? 'ok' : 'warn'}>{r.paid ? 'Paid' : 'Pending'}</Badge> },
        { key: 'a', header: '', align: 'right', cell: (r) => (r.paid ? null : <Button size="sm" variant="soft" onClick={() => pay(r)}>Pay</Button>) },
      ]}
    />
  );
};

export default Payments;
