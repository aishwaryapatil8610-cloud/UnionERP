import type * as React from 'react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Field, Input, Select, Textarea } from '../components/ui/Fields';
import { Logo } from '../components/Illustrations';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/cn';

interface Ticket { id: string; topic: string; subject: string; at: string }
const TOPICS = ['Technical problem', 'Billing and accounts', 'Training request', 'New feature idea', 'Hardware integration (analyser / weighbridge)', 'Other'];
const FAQ = [
  ['Can Kshira connect to my milk analyser and weighbridge?', 'Yes. The Machine collection and Milk reception modules are built for analyser and weighbridge readings. Send us the machine model from this form and we will share the integration steps.'],
  ['How are farmer payments calculated?', 'Each farmer gets litres x rate for the last 10 days. Rate comes from the fat and SNF rate chart. Advance recovery is deducted before the net payable is shown.'],
  ['Who can see accounting and payroll?', 'Access is controlled from Users and roles. Give accountants Finance access and keep payroll for the plant administrator.'],
  ['Is my data safe in this demo?', 'This demo keeps everything in your browser. A production setup stores data in a secured database with daily backups.'],
];

function load(): Ticket[] {
  try { return JSON.parse(localStorage.getItem('kshira-tickets') ?? '[]') as Ticket[]; } catch { return []; }
}

const Contact: React.FC<{ embedded?: boolean }> = ({ embedded }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: '', topic: TOPICS[0], subject: '', message: '' });
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [faq, setFaq] = useState<number | null>(0);
  const [tickets, setTickets] = useState<Ticket[]>(load);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      const id = 'KS-' + Math.floor(1000 + Math.random() * 9000);
      const next = [{ id, topic: f.topic, subject: f.subject, at: new Date().toLocaleString('en-IN') }, ...tickets].slice(0, 5);
      localStorage.setItem('kshira-tickets', JSON.stringify(next));
      setTickets(next);
      setSent(id);
      setBusy(false);
      toast('Request ' + id + ' received');
      setF({ ...f, subject: '', message: '' });
    }, 700);
  };

  const info = [
    { icon: <Phone size={18} />, t: 'Call us', v: '+91 98765 43210', s: 'Mon to Sat, 9 am to 7 pm' },
    { icon: <Mail size={18} />, t: 'Email', v: 'support@kshira.in', s: 'Reply within one working day' },
    { icon: <MapPin size={18} />, t: 'Visit', v: 'Ashta, Sangli district', s: 'Maharashtra, India' },
    { icon: <Clock size={18} />, t: 'Plant hours', v: '24 x 7 emergency line', s: 'For tanker and silo issues' },
  ];

  const body = (
    <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
      <Card>
        <CardHeader title="Send us a message" subtitle="Tell us what you need and we will get back to you" />
        <div className="p-5 sm:p-6">
          <AnimatePresence>
            {sent && (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mb-5 flex items-start gap-3 rounded-2xl bg-ok/10 p-4 text-ok">
                <CheckCircle2 size={22} className="mt-0.5 shrink-0" />
                <div><p className="font-bold">Request received. Ticket {sent}</p><p className="text-sm opacity-90">Our team will reply on your email shortly.</p></div>
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name"><Input value={f.name} onChange={set('name')} required /></Field>
            <Field label="Email"><Input type="email" value={f.email} onChange={set('email')} required /></Field>
            <Field label="Phone (optional)"><Input type="tel" value={f.phone} onChange={set('phone')} placeholder="+91" /></Field>
            <Field label="Topic"><Select value={f.topic} onChange={set('topic')}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</Select></Field>
            <Field label="Subject" className="sm:col-span-2"><Input value={f.subject} onChange={set('subject')} required /></Field>
            <Field label="Message" className="sm:col-span-2"><Textarea rows={5} value={f.message} onChange={set('message')} required /></Field>
            <div className="sm:col-span-2"><Button type="submit" size="lg" loading={busy} icon={<Send size={16} />}>Send request</Button></div>
          </form>
        </div>
      </Card>

      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {info.map((i) => (
            <Card key={i.t} className="p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/12 text-brand">{i.icon}</span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-mute">{i.t}</p>
              <p className="font-bold">{i.v}</p>
              <p className="text-xs text-mute">{i.s}</p>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader title="Quick answers" />
          <ul className="divide-y divide-line/70">
            {FAQ.map(([q, a], i) => (
              <li key={q}>
                <button type="button" onClick={() => setFaq(faq === i ? null : i)} aria-expanded={faq === i} className="flex w-full items-center gap-3 px-5 py-3.5 text-left text-sm font-semibold">
                  <span className="flex-1">{q}</span><ChevronDown size={16} className={cn('shrink-0 text-mute transition-transform', faq === i && 'rotate-180')} />
                </button>
                {faq === i && <p className="px-5 pb-4 text-sm text-mute">{a}</p>}
              </li>
            ))}
          </ul>
        </Card>
        {tickets.length > 0 && (
          <Card>
            <CardHeader title="Your recent requests" />
            <ul className="divide-y divide-line/70">
              {tickets.map((t) => <li key={t.id} className="flex items-center gap-3 px-5 py-3 text-sm"><span className="font-bold text-brand">{t.id}</span><span className="min-w-0 flex-1 truncate">{t.subject || t.topic}</span><span className="text-xs text-mute">{t.at}</span></li>)}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );

  if (embedded) return <div><PageHeader title="Help and contact" subtitle="Raise a support request or read quick answers." />{body}</div>;

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/login" className="flex items-center gap-3"><Logo size={40} /><span className="font-display text-xl font-extrabold">Kshira <span className="text-brand">ERP</span></span></Link>
        <div className="flex gap-2"><Link to="/login"><Button variant="outline">Sign in</Button></Link><Link to="/create-account"><Button>Create account</Button></Link></div>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-14 sm:px-10">
        <h1 className="font-display text-4xl font-extrabold sm:text-5xl">Contact us 💬</h1>
        <p className="mb-8 mt-3 max-w-xl text-mute">Questions about SmartX ERP, demos, training or machine integration? Write to us and we will respond.</p>
        {body}
      </main>
    </div>
  );
};

export default Contact;
