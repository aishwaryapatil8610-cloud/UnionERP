import type * as React from 'react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Fields';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetMail, setResetMail] = useState('');

  // const submit = (e: FormEvent) => {
  //   e.preventDefault();
  //   setBusy(true);
  //   setError('');
  //   setTimeout(() => {
  //     const res = login(email, password, remember);
  //     if (!res.ok) { setError(res.error ?? 'Could not sign in.'); setBusy(false); }
  //   }, 550);
  // };



  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const res = await login(email, password, remember);

      if (!res.ok) {
        setError(res.error ?? 'Could not sign in.');
        setBusy(false);
        return;
      }

      // Store login details if login() returns the API response
      const result = res as typeof res & {
        accessToken?: string;
        refreshToken?: string;
        accessTokenExpiry?: string;
        refreshTokenExpiry?: string;
      };

      if (result.accessToken) {
        localStorage.setItem('accessToken', result.accessToken);

        if (result.refreshToken) {
          localStorage.setItem('refreshToken', result.refreshToken);
        }

        if (result.accessTokenExpiry) {
          localStorage.setItem(
            'accessTokenExpiry',
            result.accessTokenExpiry
          );
        }

        if (result.refreshTokenExpiry) {
          localStorage.setItem(
            'refreshTokenExpiry',
            result.refreshTokenExpiry
          );
        }

        // Decode JWT payload
        const payload = JSON.parse(
          atob(result.accessToken.split('.')[1])
        );

        const userId = Number(payload.UserId);
        const companyId = Number(payload.CompanyId);

        localStorage.setItem('userId', String(userId));
        localStorage.setItem('companyId', String(companyId));
        localStorage.setItem('userData', JSON.stringify(payload));
        localStorage.setItem('firmId', '1001');
        localStorage.setItem('combinedId', '1001101');

        const isAdmin =
          payload.IsAdmin === 'True' || payload.IsAdmin === true;

        localStorage.setItem('role', isAdmin ? 'admin' : 'user');

        console.log('Saved UserId:', userId);
        console.log('Saved CompanyId:', companyId);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  };






  const demo = () => { setEmail('admin@kshira.in'); setPassword('kshira123'); setError(''); };

  return (
    <AuthShell
      title="Welcome back 👋"
      subtitle="Sign in to run gate, reception, silos, production, dispatch, accounts and farmer payments."
      footer={<>New to SmartX? <Link to="/create-account" className="font-bold text-brand hover:underline">Create an account</Link> · <Link to="/contact" className="font-bold text-brand hover:underline">Contact us</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate={false}>
        <Field label="Email"><Input type="email" autoComplete="username" placeholder="you@plant.in" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={16} />} required /></Field>
        <Field label="Password">
          <div className="relative">
            <Input type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={16} />} required />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex cursor-pointer items-center gap-2 font-medium"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--brand))]" />Keep me signed in</label>
          <button type="button" onClick={() => { setResetMail(email); setForgot(true); }} className="font-semibold text-brand hover:underline">Forgot password?</button>
        </div>
        {error && <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger" role="alert">{error}</motion.p>}
        <Button type="submit" size="lg" loading={busy} className="w-full">Sign in</Button>
        <button type="button" onClick={demo} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand/50 bg-brand/5 px-4 py-3 text-sm font-semibold text-brand hover:bg-brand/10"><Sparkles size={16} />Fill demo login (admin@kshira.in)</button>
      </form>

      <Modal open={forgot} onClose={() => setForgot(false)} title="Reset your password" subtitle="We will email you a reset link" footer={<><Button variant="ghost" onClick={() => setForgot(false)}>Cancel</Button><Button onClick={() => { setForgot(false); toast('Reset link sent to ' + (resetMail || 'your email') + ' (demo)'); }}>Send reset link</Button></>}>
        <Field label="Registered email"><Input type="email" value={resetMail} onChange={(e) => setResetMail(e.target.value)} icon={<Mail size={16} />} placeholder="you@plant.in" /></Field>
        <p className="mt-3 text-xs text-mute">This is a demo build, so no real email is sent.</p>
      </Modal>
    </AuthShell>
  );
};

export default Login;
