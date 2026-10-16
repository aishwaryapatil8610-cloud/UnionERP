import type * as React from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo, Tanker } from './Illustrations';
import { useTheme } from '../context/ThemeContext';

const CHIPS = ['🐄 Collect', '🚪 Gate', '🔬 Test', '🛢️ Silo', '🧈 Make', '🚚 Dispatch', '📒 Account'];

interface Props { title: string; subtitle: string; children: ReactNode; footer?: ReactNode; wide?: boolean }

export const AuthShell: React.FC<Props> = ({ title, subtitle, children, footer, wide }) => {
  const { theme, toggle } = useTheme();
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(420px,1fr)_1.1fr]">
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-3"><Logo size={42} /><p className="font-display text-2xl font-extrabold">Kshira <span className="text-brand">ERP</span></p></Link>
          <button type="button" onClick={toggle} aria-label="Switch theme" className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel text-mute hover:text-ink">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
        </div>
        <motion.div className={'mx-auto flex w-full flex-1 flex-col justify-center py-8 ' + (wide ? 'max-w-lg' : 'max-w-md')} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-[2.6rem]">{title}</h1>
          <p className="mt-3 text-mute">{subtitle}</p>
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-mute">{footer}</div>}
        </motion.div>
        <p className="text-center text-xs text-mute">SmartX ERP · demo environment</p>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#4C1D95] via-brand to-accent text-white grad-move lg:block">
        <div className="blob absolute -left-24 top-10 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
        <div className="blob absolute -bottom-24 right-0 h-[28rem] w-[28rem] rounded-full bg-[#F9A8D4]/30 blur-3xl" style={{ animationDelay: '-6s' }} />
        <div className="relative flex h-full flex-col justify-center gap-8 px-14 py-12">
          <div>
            <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]">Dairy plant operating system</p>
            <h2 className="mt-4 max-w-xl font-display text-5xl font-extrabold leading-[1.05]">Every tanker tracked. Every litre accounted for.</h2>
            <p className="mt-4 max-w-md text-white/80">From the farmer's can to the ledger: gate, lab, silo, production, dispatch, sales and payments in one place.</p>
          </div>

          <div className="relative h-60">
            <motion.div className="glass floaty absolute left-0 top-0 w-60 rounded-3xl p-4" style={{ '--r': '-3deg' } as React.CSSProperties}>
              <p className="text-xs font-semibold text-white/80">🛢️ Silo 2 · Raw milk</p>
              <p className="mt-1 font-display text-3xl font-extrabold">87%</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/25"><div className="h-full w-[87%] rounded-full bg-white" /></div>
            </motion.div>
            <motion.div className="glass floaty absolute right-4 top-6 w-56 rounded-3xl p-4" style={{ '--r': '3deg', animationDelay: '-2s' } as React.CSSProperties}>
              <p className="text-xs font-semibold text-white/80">🥛 Received today</p>
              <p className="mt-1 font-display text-3xl font-extrabold">10,090 L</p>
              <p className="mt-1 text-xs text-white/75">3 tankers accepted</p>
            </motion.div>
            <motion.div className="glass floaty absolute bottom-0 left-16 w-64 rounded-3xl p-4" style={{ '--r': '-1deg', animationDelay: '-4s' } as React.CSSProperties}>
              <p className="text-xs font-semibold text-white/80">💸 Farmer payout (10 days)</p>
              <p className="mt-1 font-display text-3xl font-extrabold">₹ 4.2 L</p>
              <p className="mt-1 text-xs text-white/75">48 farmers ready to pay</p>
            </motion.div>
          </div>

          <div className="relative h-20 overflow-hidden rounded-3xl glass">
            <div className="absolute bottom-5 left-0 right-0 border-t-2 border-dashed border-white/40" />
            <div className="absolute bottom-3 left-0 animate-drive"><Tanker size={110} /></div>
          </div>

          <ul className="flex flex-wrap gap-2">
            {CHIPS.map((c, i) => (
              <motion.li key={c} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="glass rounded-full px-3 py-1.5 text-sm font-semibold">{c}</motion.li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
