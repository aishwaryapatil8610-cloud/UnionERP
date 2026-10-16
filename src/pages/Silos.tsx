import type * as React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { useData } from '../context/DataContext';
import { nf } from '../lib/format';
import type { Silo } from '../types';

export const SiloTank: React.FC<{ silo: Silo; height?: number }> = ({ silo, height = 180 }) => {
  const pct = Math.round((silo.level / silo.capacity) * 100);
  const hot = silo.temp > 6;
  const fill = pct > 90 ? 'rgb(var(--danger))' : pct > 75 ? 'rgb(var(--warn))' : 'rgb(var(--brand))';
  return (
    <div className="relative mx-auto w-28 overflow-hidden rounded-[2rem] border-2 border-line bg-soft" style={{ height }}>
      <motion.div className="absolute inset-x-0 bottom-0" style={{ background: fill, opacity: 0.9 }} initial={{ height: 0 }} animate={{ height: pct + '%' }} transition={{ duration: 1.1, ease: 'easeOut' }}>
        <svg className="absolute -top-2 left-0 h-3 w-[200%] animate-wave text-white/40" viewBox="0 0 180 12" preserveAspectRatio="none" aria-hidden>
          <path d="M0 6c15-8 30 8 45 0s30 8 45 0 30 8 45 0 30 8 45 0V12H0z" fill="currentColor" />
        </svg>
      </motion.div>
      <div className="absolute inset-0 grid place-items-center"><span className={'rounded-full bg-panel/85 px-2.5 py-1 font-display text-lg font-extrabold tnum ' + (hot ? 'text-danger' : '')}>{pct}%</span></div>
    </div>
  );
};

const Silos: React.FC = () => {
  const { db } = useData();
  const total = db.silos.reduce((s, x) => s + x.level, 0);
  const cap = db.silos.reduce((s, x) => s + x.capacity, 0);
  return (
    <div>
      <PageHeader title="Silos and stock" subtitle={'Total ' + nf(total) + ' L stored of ' + nf(cap) + ' L capacity.'} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {db.silos.map((s, i) => {
          const pct = Math.round((s.level / s.capacity) * 100);
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold">{s.name}</h3><Badge tone={s.kind === 'Raw milk' ? 'brand' : 'neutral'}>{s.kind}</Badge></div>
                <SiloTank silo={s} />
                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-xs text-mute">Stored</dt><dd className="font-bold tnum">{nf(s.level)} L</dd></div>
                  <div><dt className="text-xs text-mute">Free space</dt><dd className="font-bold tnum">{nf(s.capacity - s.level)} L</dd></div>
                  <div><dt className="text-xs text-mute">Temperature</dt><dd className={'font-bold tnum ' + (s.temp > 6 ? 'text-danger' : '')}>{s.temp.toFixed(1)} C</dd></div>
                  <div><dt className="text-xs text-mute">State</dt><dd><Badge dot tone={pct > 90 ? 'danger' : s.temp > 6 ? 'warn' : 'ok'}>{pct > 90 ? 'Almost full' : s.temp > 6 ? 'Too warm' : 'Healthy'}</Badge></dd></div>
                </dl>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Silos;
