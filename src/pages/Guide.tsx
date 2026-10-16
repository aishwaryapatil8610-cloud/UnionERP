import type * as React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { ALL_ITEMS } from '../layout/nav';
import guide from '../lib/guide.json';
import { cn } from '../lib/cn';

const Guide: React.FC = () => {
  const [open, setOpen] = useState<string | null>('gate');
  return (
    <div>
      <PageHeader title="How to use SmartX ERP" subtitle="The journey of milk through the plant, and what to do in each module." />

      <Card className="mb-6 p-5 sm:p-6">
        <h3 className="mb-4 text-lg font-bold">The milk journey</h3>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {guide.flow.map((s, i) => (
            <motion.li key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="relative rounded-2xl bg-soft p-4">
              <span className="mb-2 grid h-8 w-8 place-items-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
              <p className="font-bold">{s.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-mute">{s.text}</p>
            </motion.li>
          ))}
        </ol>
      </Card>

      <div className="space-y-3">
        {guide.modules.map((m) => {
          const isOpen = open === m.id;
          const nav = ALL_ITEMS.find((n) => n.to === m.route);
          return (
            <Card key={m.id} className="overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : m.id)} aria-expanded={isOpen} className="flex w-full items-center gap-4 px-5 py-4 text-left">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-soft"><span className="text-xl">{nav?.emoji}</span></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-bold">{m.title}</span>
                  <span className="block truncate text-sm text-mute">{m.summary}</span>
                </span>
                <ChevronDown size={18} className={cn('shrink-0 text-mute transition-transform', isOpen && 'rotate-180')} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="border-t border-line px-5 py-5">
                      <ol className="space-y-2.5">
                        {m.steps.map((s, i) => (
                          <li key={i} className="flex gap-3 text-sm"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-soft text-xs font-bold">{i + 1}</span><span>{s}</span></li>
                        ))}
                      </ol>
                      <p className="mt-4 rounded-2xl bg-cream/40 px-4 py-3 text-sm dark:bg-cream/10"><b>Tip:</b> {m.tip}</p>
                      <Link to={m.route} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">Open {m.title}<ExternalLink size={14} /></Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Guide;
