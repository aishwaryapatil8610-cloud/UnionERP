import type * as React from 'react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Fields';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/cn';

const ROLES = ['Plant administrator', 'Plant manager', 'Accountant', 'Lab chemist', 'Gate officer', 'Weighbridge operator', 'Sales executive'];

function strength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

const CreateAccount: React.FC = () => {
  const { register } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ name: '', email: '', plant: '', role: ROLES[0], password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const score = useMemo(() => strength(f.password), [f.password]);
  const label = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'][score];
  const colour = ['bg-line', 'bg-danger', 'bg-warn', 'bg-brand', 'bg-ok'][score];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (f.password.length < 8) return setError('Password must be at least 8 characters.');
    if (f.password !== f.confirm) return setError('Both passwords must match.');
    if (!terms) return setError('Please accept the terms to continue.');
    setError('');
    setBusy(true);
    setTimeout(() => {
      const res = register({ name: f.name.trim(), email: f.email, password: f.password, role: f.role, plant: f.plant.trim() || 'My Dairy Plant' });
      if (!res.ok) { setError(res.error ?? 'Could not create the account.'); setBusy(false); } else toast('Account created. Welcome to Kshira!');
    }, 600);
  };

  return (
    <AuthShell wide title="Create your account ✨" subtitle="Set up your plant workspace in a minute. You can invite staff later from Users and roles." footer={<>Already registered? <Link to="/login" className="font-bold text-brand hover:underline">Sign in</Link> · <Link to="/contact" className="font-bold text-brand hover:underline">Need help?</Link></>}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name"><Input value={f.name} onChange={set('name')} icon={<User size={16} />} placeholder="ABC ABC" autoComplete="name" required /></Field>
        <Field label="Work email"><Input type="email" value={f.email} onChange={set('email')} icon={<Mail size={16} />} placeholder="you@plant.in" autoComplete="email" required /></Field>
        <Field label="Plant / dairy name"><Input value={f.plant} onChange={set('plant')} icon={<Building2 size={16} />} placeholder="Sahyadri Dairy Plant" required /></Field>
        <Field label="Your role"><Select value={f.role} onChange={set('role')}>{ROLES.map((r) => <option key={r}>{r}</option>)}</Select></Field>
        <Field label="Password" className="sm:col-span-1">
          <div className="relative">
            <Input type={show ? 'text' : 'password'} value={f.password} onChange={set('password')} icon={<Lock size={16} />} placeholder="Min 8 characters" autoComplete="new-password" required />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        </Field>
        <Field label="Confirm password"><Input type={show ? 'text' : 'password'} value={f.confirm} onChange={set('confirm')} icon={<Lock size={16} />} placeholder="Repeat password" autoComplete="new-password" required /></Field>
        <div className="sm:col-span-2">
          <div className="flex gap-1.5">{[1, 2, 3, 4].map((i) => <span key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= score ? colour : 'bg-line')} />)}</div>
          <p className="mt-1.5 text-xs text-mute">Password strength: <b>{f.password ? label : '-'}</b>. Use capital letters, numbers and a symbol.</p>
        </div>
        <label className="flex cursor-pointer items-start gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[rgb(var(--brand))]" />I agree to the terms of use and understand this is a demo workspace.</label>
        {error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger sm:col-span-2" role="alert">{error}</motion.p>}
        <Button type="submit" size="lg" loading={busy} className="w-full sm:col-span-2">Create account</Button>
      </form>
    </AuthShell>
  );
};

export default CreateAccount;
