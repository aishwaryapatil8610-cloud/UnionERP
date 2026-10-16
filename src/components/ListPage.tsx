import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Download, Plus, Search } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { PageHeader } from './ui/PageHeader';
import { DataTable, type Column } from './ui/DataTable';
import { Field, Input, Select } from './ui/Fields';
import { Modal } from './ui/Modal';
import { downloadCsv } from '../lib/csv';
import { useToast } from '../context/ToastContext';

export interface FormField { key: string; label: string; type?: 'text' | 'number' | 'select' | 'date' | 'tel'; options?: string[]; value?: string; step?: string }
export interface Stat { label: string; value: string; tone?: string }

interface Props<T extends { id: string }> {
  title: string;
  subtitle: string;
  rows: T[];
  columns: Column<T>[];
  fields?: FormField[];
  addLabel?: string;
  onAdd?: (v: Record<string, string>) => void;
  stats?: Stat[];
  filter?: { label: string; get: (r: T) => string; options: string[] };
  csvName?: string;
  extra?: ReactNode;
  actions?: ReactNode;
}

export function ListPage<T extends { id: string }>({ title, subtitle, rows, columns, fields, addLabel = 'Add new', onAdd, stats, filter, csvName, extra, actions }: Props<T>) {
  const [q, setQ] = useState('');
  const [f, setF] = useState('All');
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const initial = () => Object.fromEntries((fields ?? []).map((x) => [x.key, x.value ?? (x.type === 'select' ? x.options?.[0] ?? '' : '')]));
  const [vals, setVals] = useState<Record<string, string>>(initial);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => (f === 'All' || !filter || filter.get(r) === f) && (!needle || JSON.stringify(Object.values(r)).toLowerCase().includes(needle)));
  }, [rows, q, f, filter]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onAdd?.(vals);
    toast(title + ': entry saved');
    setOpen(false);
    setVals(initial());
  };

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            {actions}
            {csvName && <Button variant="outline" icon={<Download size={16} />} onClick={() => downloadCsv(csvName, shown)}>Export CSV</Button>}
            {fields && onAdd && <Button icon={<Plus size={16} />} onClick={() => { setVals(initial()); setOpen(true); }}>{addLabel}</Button>}
          </>
        }
      />
      {stats && (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-mute">{s.label}</p>
              <p className={'mt-1 font-display text-2xl font-extrabold tnum sm:text-3xl ' + (s.tone ?? '')}>{s.value}</p>
            </Card>
          ))}
        </div>
      )}
      {extra}
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="min-w-[200px] flex-1 sm:max-w-sm"><Input icon={<Search size={16} />} placeholder="Search anything in this table" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          {filter && (
            <div className="w-44">
              <Select aria-label={filter.label} value={f} onChange={(e) => setF(e.target.value)}>
                <option value="All">{filter.label}: All</option>
                {filter.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </Select>
            </div>
          )}
          <span className="ml-auto text-sm text-mute tnum">{shown.length} records</span>
        </div>
        <DataTable columns={columns} rows={shown} rowKey={(r) => r.id} pageSize={10} />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={addLabel} subtitle="Fill the details and save" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="list-form">Save entry</Button></>}>
        <form id="list-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {(fields ?? []).map((x) => (
            <Field key={x.key} label={x.label}>
              {x.type === 'select' ? (
                <Select value={vals[x.key] ?? ''} onChange={(e) => setVals({ ...vals, [x.key]: e.target.value })}>{x.options?.map((o) => <option key={o}>{o}</option>)}</Select>
              ) : (
                <Input type={x.type ?? 'text'} step={x.step} required value={vals[x.key] ?? ''} onChange={(e) => setVals({ ...vals, [x.key]: e.target.value })} />
              )}
            </Field>
          ))}
        </form>
      </Modal>
    </div>
  );
}
