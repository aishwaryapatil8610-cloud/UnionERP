import type * as React from 'react';
import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Moon, Sun } from 'lucide-react';
import { ALL_ITEMS } from './nav';
import { Sidebar } from './Sidebar';
import { PageLoader } from '../components/PageLoader';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/cn';

const AppLayout: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { theme, toggle } = useTheme();
  const { settings } = useData();
  const page = ALL_ITEMS.find((i) => (i.to === '/' ? pathname === '/' : pathname.startsWith(i.to)));

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', key);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', key); };
  }, [open]);

  return (
    <div className="min-h-screen">
      {/* Desktop: sidebar is always visible, there is no hamburger */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[292px] p-3 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile and tablet drawer: plain CSS transitions so it always opens */}
      <div className={cn('fixed inset-0 z-[60] lg:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')} aria-hidden={!open}>
        <div onClick={() => setOpen(false)} className={cn('absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')} />
        <div className={cn('absolute inset-y-0 left-0 w-[310px] max-w-[88vw] p-3 transition-transform duration-300 ease-out', open ? 'translate-x-0' : '-translate-x-full')}>
          <Sidebar onNavigate={() => setOpen(false)} onClose={() => setOpen(false)} />
        </div>
      </div>

      <div className="lg:pl-[292px] print:!pl-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-6">
          <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-panel text-ink active:scale-95 lg:hidden"><Menu size={20} /></button>
          <span className="hidden h-10 w-10 place-items-center rounded-xl bg-soft text-lg sm:grid">{page?.emoji ?? '🥛'}</span>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold leading-tight">{page?.label ?? 'SmartX ERP'}</p>
            <p className="hidden truncate text-xs text-mute sm:block">{page?.hint ?? settings.plant}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full bg-ok/15 px-3 py-1.5 text-xs font-semibold text-ok md:inline-flex"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" /><span className="relative h-2 w-2 rounded-full bg-ok" /></span>Plant online</span>
            <button type="button" onClick={toggle} aria-label="Switch theme" className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel text-mute hover:text-ink">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <Suspense fallback={<PageLoader />}>
            <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
              <Outlet />
            </motion.div>
          </Suspense>
        </main>
        <footer className="px-6 pb-8 print:hidden pt-2 text-center text-xs text-mute">{settings.plant} · SmartX ERP · demo data</footer>
      </div>
    </div>
  );
};

export default AppLayout;
