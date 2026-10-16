import type * as React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import type { DB, DBKey } from "../types";
import { buildDB } from "../lib/data";


export interface Settings { plant: string; minFat: number; minSnf: number }
interface Ctx {
  db: DB;
  settings: Settings;
  setSettings: (s: Settings) => void;
  add: <K extends DBKey>(key: K, row: DB[K][number]) => void;
  patch: <K extends DBKey>(key: K, id: string, part: Partial<DB[K][number]>) => void;
  nextId: (prefix: string) => string;
}
const C = createContext<Ctx | null>(null);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<DB>(() => buildDB());
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>({ plant: user?.plant ?? "Sahyadri Dairy Plant", minFat: 3.5, minSnf: 8.2 });
  useEffect(() => { if (user?.plant) setSettings((s) => ({ ...s, plant: user.plant })); }, [user?.plant]);
  const add = useCallback(<K extends DBKey>(key: K, row: DB[K][number]) => {
    setDb((s) => ({ ...s, [key]: [row, ...(s[key] as unknown[])] }) as DB);
  }, []);
  const patch = useCallback(<K extends DBKey>(key: K, id: string, part: Partial<DB[K][number]>) => {
    setDb((s) => ({ ...s, [key]: (s[key] as { id: string }[]).map((x) => (x.id === id ? { ...x, ...part } : x)) }) as DB);
  }, []);
  const nextId = useCallback((p: string) => p + Date.now().toString(36).toUpperCase(), []);
  const value = useMemo(() => ({ db, settings, setSettings, add, patch, nextId }), [db, settings, add, patch, nextId]);
  return <C.Provider value={value}>{children}</C.Provider>;
};

export function useData() {
  const c = useContext(C);
  if (!c) throw new Error("useData must be used inside DataProvider");
  return c;
}


