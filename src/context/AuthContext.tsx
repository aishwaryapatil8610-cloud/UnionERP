import type * as React from 'react';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export interface User { name: string; email: string; role: string; plant: string }
interface Stored extends User { password: string }
export interface RegisterInput { name: string; email: string; password: string; role: string; plant: string }
// interface Result { ok: boolean; error?: string }

interface Result {
  ok: boolean;
  error?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiry?: string;
  refreshTokenExpiry?: string;
}

interface AuthCtx {
  user: User | null;
  // login: (email: string, password: string, remember: boolean) => Result;
  login: (
    email: string,
    password: string,
    remember: boolean
  ) => Promise<Result>;
  register: (input: RegisterInput) => Result;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const SESSION = 'kshira-session';
const USERS = 'kshira-users';
const DEMO: Stored = { name: 'Admin', email: 'admin@kshira.in', password: 'kshira123', role: 'Plant administrator', plant: 'Sahyadri Dairy Plant' };

function readUsers(): Stored[] {
  try { return JSON.parse(localStorage.getItem(USERS) ?? '[]') as Stored[]; } catch { return []; }
}
function strip(u: Stored): User { return { name: u.name, email: u.email, role: u.role, plant: u.plant }; }
function readSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION) ?? sessionStorage.getItem(SESSION);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch { return null; }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(readSession);

  const value = useMemo<AuthCtx>(() => ({
    user,
    // login: async (email, password, remember) => {
    //     const mail = email.trim().toLowerCase();
    //     const found = [DEMO, ...readUsers()].find((u) => u.email.toLowerCase() === mail);
    //     if (!found) return { ok: false, error: 'No account found for this email. Create one first.' };
    //     if (found.password !== password) return { ok: false, error: 'Wrong password. Please try again.' };
    //     const u = strip(found);
    //     localStorage.removeItem(SESSION);
    //     sessionStorage.removeItem(SESSION);
    //     (remember ? localStorage : sessionStorage).setItem(SESSION, JSON.stringify(u));
    //     setUser(u);
    //     return { ok: true };
    //   },



    login: async (email, password, remember) => {
      try {
        const response = await fetch(
          'http://192.168.1.3:806/api/Auth/login',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email.trim(),
              password: password,
            }),
          }
        );

        const raw = await response.json().catch(() => null);

        console.log('Login API Status:', response.status);
        console.log('Login API Response:', raw);

        if (!response.ok) {
          return {
            ok: false,
            error:
              raw?.message ||
              raw?.Message ||
              raw?.error ||
              'Login failed. Please check your credentials.',
          };
        }

        // Handle common API response structures
        const data = raw?.data ?? raw?.Data ?? raw;
        const accessToken =
          data?.accessToken ??
          data?.AccessToken ??
          data?.token ??
          data?.Token;

        if (!accessToken) {
          return {
            ok: false,
            error: 'Login succeeded, but access token was not found in the response.',
          };
        }

        const result = {
          ok: true,
          accessToken,
          refreshToken:
            data?.refreshToken ?? data?.RefreshToken,
          accessTokenExpiry:
            data?.accessTokenExpiry ?? data?.AccessTokenExpiry,
          refreshTokenExpiry:
            data?.refreshTokenExpiry ?? data?.RefreshTokenExpiry,
        };

        // Save the actual backend token
        localStorage.setItem('accessToken', result.accessToken);

        if (result.refreshToken) {
          localStorage.setItem('refreshToken', result.refreshToken);
        }

        // Decode JWT payload
        const payload = JSON.parse(
          atob(result.accessToken.split('.')[1])
        );

        const userId = Number(payload.UserId ?? payload.userId);
        const companyId = Number(payload.CompanyId ?? payload.companyId);

        if (Number.isFinite(userId)) {
          localStorage.setItem('userId', String(userId));
        }

        if (Number.isFinite(companyId)) {
          localStorage.setItem('companyId', String(companyId));
        }

        localStorage.setItem('userData', JSON.stringify(payload));

        const u: User = {
          name: payload.Name ?? payload.name ?? email,
          email: payload.Email ?? payload.email ?? email,
          role:
            payload.IsAdmin === true || payload.IsAdmin === 'True'
              ? 'Admin'
              : 'User',
          plant: payload.Plant ?? payload.plant ?? '',
        };

        localStorage.removeItem(SESSION);
        sessionStorage.removeItem(SESSION);

        (remember ? localStorage : sessionStorage).setItem(
          SESSION,
          JSON.stringify(u)
        );

        setUser(u);

        return result;
      } catch (error) {
        console.error('Login API Error:', error);

        return {
          ok: false,
          error: 'Unable to connect to the login server.',
        };
      }
    },




    register: (input) => {
      const mail = input.email.trim().toLowerCase();
      if ([DEMO, ...readUsers()].some((u) => u.email.toLowerCase() === mail)) return { ok: false, error: 'This email is already registered. Try signing in.' };
      const rec: Stored = { ...input, email: mail };
      localStorage.setItem(USERS, JSON.stringify([...readUsers(), rec]));
      const u = strip(rec);
      sessionStorage.setItem(SESSION, JSON.stringify(u));
      setUser(u);
      return { ok: true };
    },
    logout: () => {
      localStorage.removeItem(SESSION);
      sessionStorage.removeItem(SESSION);
      setUser(null);
    },
  }), [user]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
}
