import type * as React from 'react';
import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, LogOut, X } from 'lucide-react';
import { NAV } from './nav';
import { Logo } from '../components/Illustrations';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/cn';
import { initials, nf, todayISO } from '../lib/format';

interface Props { onNavigate?: () => void; onClose?: () => void }

export const Sidebar: React.FC<Props> = ({ onNavigate, onClose }) => {
  const { settings, db } = useData();
  const { user, logout } = useAuth();
  const toast = useToast();
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  const litres = useMemo(() => db.collections.filter((c) => c.date === todayISO()).reduce((s, c) => s + c.qty, 0), [db.collections]);
  const badges: Record<string, { n: number; tone: string }> = {
    '/gate': { n: db.gate.filter((g) => g.status === 'Inside').length, tone: 'bg-warn text-white' },
    '/reception': { n: db.reception.filter((r) => r.status === 'Pending').length, tone: 'bg-accent text-white' },
    '/inventory': { n: db.items.filter((i) => i.stock <= i.reorder).length, tone: 'bg-danger text-white' },
    '/expenses': { n: db.expenses.filter((e) => e.status === 'Pending').length, tone: 'bg-warn text-white' },
    '/services': { n: db.services.filter((s) => s.status === 'Scheduled').length, tone: 'bg-brand text-white' },
    '/assets': { n: db.assets.filter((a) => a.status !== 'Working').length, tone: 'bg-danger text-white' },
  };
  const hour = new Date().getHours();
  const shift = hour < 12 ? '🌅 Morning shift' : hour < 18 ? '☀️ Day shift' : '🌙 Evening shift';

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line bg-panel shadow-pop">
      <div className="flex items-center gap-3 px-5 pb-2 pt-5">
        <Logo size={42} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-extrabold leading-none">SmartX <span className="text-brand">ERP</span></p>
          <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">{settings.plant}</p>
        </div>
        {onClose && <button type="button" onClick={onClose} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-xl border border-line text-mute hover:text-ink"><X size={18} /></button>}
      </div>

      {/* <div className="mx-4 mt-2 overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-[#9B5CF6] to-accent p-4 text-white grad-move">
        <p className="text-xs font-semibold opacity-90">{shift}</p>
        <p className="mt-1 font-display text-2xl font-extrabold tnum">{nf(litres)} <span className="text-sm font-semibold opacity-90">L collected</span></p>
        <p className="mt-0.5 text-[11px] opacity-80">Live from all centres</p>
      </div> */}

      <nav className="mt-3 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {NAV.map((g) => {
          const shut = closed[g.title];
          return (
            <div key={g.title}>
              <button type="button" onClick={() => setClosed((c) => ({ ...c, [g.title]: !c[g.title] }))} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-mute hover:text-ink" aria-expanded={!shut}>
                <span className="text-sm normal-case tracking-normal">{g.emoji}</span>
                <span className="flex-1 text-left">{g.title}</span>
                <ChevronDown size={14} className={cn('transition-transform', shut && '-rotate-90')} />
              </button>
              {!shut && (
                <ul className="mb-1 space-y-0.5">
                  {g.items.map((it) => {
                    const b = badges[it.to];
                    return (
                      <li key={it.to}>
                        <NavLink to={it.to} end={it.to === '/'} onClick={onNavigate} className={({ isActive }) => cn('group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold transition-all', isActive ? 'bg-gradient-to-r from-brand to-[#9B5CF6] text-white shadow-lift' : 'text-ink/80 hover:bg-soft')}>
                          {({ isActive }) => (
                            <>
                              <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg text-base transition-transform group-hover:scale-110', isActive ? 'bg-white/25' : 'bg-soft')}>{it.emoji}</span>
                              <span className="min-w-0 flex-1 truncate">{it.label}</span>
                              {b && b.n > 0 && <span className={cn('grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold', isActive ? 'bg-white text-brand' : b.tone)}>{b.n}</span>}
                            </>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-2xl bg-soft p-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-accent text-sm font-bold text-white">{initials(user?.name ?? 'U')}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{user?.name}</p><p className="truncate text-xs text-mute">{user?.role}</p></div>
          <button type="button" onClick={() => { toast('Signed out. See you soon!', 'info'); logout(); }} aria-label="Sign out" title="Sign out" className="grid h-10 w-10 place-items-center rounded-xl text-danger hover:bg-danger/10"><LogOut size={17} /></button>
        </div>
      </div>
    </div>
  );
};
