import type * as React from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Droplets, HandCoins, IndianRupee, Milk, Truck, Warehouse } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { ChartTip } from '../components/ChartTip';
import { useData } from '../context/DataContext';
import { useChartColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { addDays, fmtShort, nf, todayISO } from '../lib/format';
import { NAV } from '../layout/nav';

const Dashboard: React.FC = () => {
  const { db } = useData();
  const { user } = useAuth();
  const col = useChartColors();
  const today = todayISO();

  const daily = useMemo(() => {
    const m = new Map<string, number>();
    db.collections.forEach((c) => m.set(c.date, (m.get(c.date) ?? 0) + c.qty));
    return [...m.entries()].sort().map(([date, litres]) => ({ date, litres: Math.round(litres) }));
  }, [db.collections]);

  const centres = useMemo(() => {
    const m = new Map<string, number>();
    db.collections.filter((c) => c.date >= addDays(today, -6)).forEach((c) => m.set(c.centre, (m.get(c.centre) ?? 0) + c.qty));
    return [...m.entries()].map(([centre, litres]) => ({ centre, litres: Math.round(litres) }));
  }, [db.collections, today]);

  const collected = db.collections.filter((c) => c.date === today).reduce((s, c) => s + c.qty, 0);
  const received = db.reception.filter((r) => r.date === today && r.status === 'Accepted').reduce((s, r) => s + r.qty, 0);
  const stock = db.silos.reduce((s, x) => s + x.level, 0);
  const inside = db.gate.filter((g) => g.status === 'Inside').length;
  const dues = db.sales.filter((s) => !s.paid).reduce((s, x) => s + x.amount, 0);
  const salesToday = db.sales.filter((s) => s.date === today).reduce((s, x) => s + x.amount, 0);
  const spark = daily.map((d) => d.litres);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const quick = NAV.flatMap((g) => g.items).filter((i) => ['/gate', '/reception', '/collection', '/accounting', '/payments', '/dispatch'].includes(i.to));

  return (
    <div>
      <PageHeader title={greet + ', ' + (user?.name.split(' ')[0] ?? '')} subtitle="Here is how the plant is doing right now." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Collected today" value={collected} suffix="L" icon={<Droplets size={18} />} spark={spark} hint="Machine entries from all centres" />
        <StatCard label="Received at plant today" value={received} suffix="L" icon={<Milk size={18} />} tone="text-ok" hint="Accepted tankers only" />
        <StatCard label="Silo stock" value={stock} suffix="L" icon={<Warehouse size={18} />} tone="text-buffalo" hint="Across all four silos" />
        <StatCard label="Vehicles inside" value={inside} icon={<Truck size={18} />} tone="text-warn" hint="Still to be marked exited" />
        <StatCard label="Sales today" value={salesToday} prefix="Rs " icon={<IndianRupee size={18} />} tone="text-ok" hint="Invoices raised today" />
        <StatCard label="Customer dues" value={dues} prefix="Rs " icon={<HandCoins size={18} />} tone="text-danger" hint="Unpaid invoices" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title="Milk collected per day" subtitle="Litres from machine collection, last 14 days" />
          <div className="h-72 px-2 pb-4 pt-3 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col.brand} stopOpacity={0.4} /><stop offset="100%" stopColor={col.brand} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke={col.grid} vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtShort} tick={{ fill: col.tick, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tick={{ fill: col.tick, fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<ChartTip title={(l) => fmtShort(String(l))} format={(v) => nf(v) + ' L'} />} />
                <Area type="monotone" dataKey="litres" name="Litres" stroke={col.brand} strokeWidth={3} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Silo levels" subtitle="Live fill percentage" />
          <ul className="space-y-4 p-5 sm:p-6">
            {db.silos.map((s, i) => {
              const pct = Math.round((s.level / s.capacity) * 100);
              return (
                <li key={s.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-semibold">{s.name} <span className="font-normal text-mute">· {s.kind}</span></span><span className="font-bold tnum">{pct}%</span></div>
                  <div className="h-3 overflow-hidden rounded-full bg-soft"><motion.div className={'h-full rounded-full ' + (pct > 90 ? 'bg-danger' : pct > 75 ? 'bg-warn' : 'bg-brand')} initial={{ width: 0 }} animate={{ width: pct + '%' }} transition={{ duration: 0.9, delay: i * 0.1 }} /></div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Collection by centre" subtitle="Litres, last 7 days" />
          <div className="h-60 px-2 pb-4 pt-3 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={centres}>
                <CartesianGrid stroke={col.grid} vertical={false} />
                <XAxis dataKey="centre" tick={{ fill: col.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: col.tick, fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<ChartTip format={(v) => nf(v) + ' L'} />} cursor={{ fill: col.grid }} />
                <Bar dataKey="litres" name="Litres" fill={col.brand} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Gate activity" subtitle="Latest vehicles" action={<Link to="/gate" className="text-sm font-semibold text-brand">Open register</Link>} />
          <ul className="divide-y divide-line/70 p-2 sm:p-3">
            {db.gate.slice(0, 5).map((g) => (
              <li key={g.id} className="flex items-center gap-3 px-3 py-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand"><Truck size={18} /></span>
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{g.vehicle}</p><p className="truncate text-xs text-mute">{g.type} · {g.party}</p></div>
                <Badge dot tone={g.status === 'Inside' ? 'warn' : 'ok'}>{g.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-xl font-bold">Jump to a module</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {quick.map((q, i) => (
          <motion.div key={q.to} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
            <Link to={q.to} className="group flex h-full flex-col gap-3 rounded-3xl border border-line bg-panel p-4 shadow-lift transition-colors hover:border-brand">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-soft text-xl">{q.emoji}</span>
              <div className="flex-1"><p className="font-bold leading-tight">{q.label}</p><p className="mt-1 text-xs text-mute">{q.hint}</p></div>
              <ArrowRight size={16} className="text-mute transition-transform group-hover:translate-x-1 group-hover:text-brand" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
