import type * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Field, Input } from '../components/ui/Fields';
import { rateOf } from '../lib/data';
import { inr } from '../lib/format';

const FATS = [3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5];
const SNFS = [8.0, 8.25, 8.5, 8.75, 9.0, 9.25];

const RateChart: React.FC = () => {
  const [fat, setFat] = useState('4.2');
  const [snf, setSnf] = useState('8.6');
  const [litres, setLitres] = useState('10');
  const rate = rateOf(Number(fat) || 0, Number(snf) || 0);
  const min = rateOf(FATS[0], SNFS[0]);
  const max = rateOf(FATS[FATS.length - 1], SNFS[SNFS.length - 1]);

  return (
    <div>
      <PageHeader title="Rate chart" subtitle="Milk price per litre from fat and SNF. Rate = fat x 6.20 + SNF x 3.10." />
      <div className="grid gap-5 xl:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader title="Rate calculator" subtitle="Try a reading and see what the farmer earns" />
          <div className="grid gap-4 p-5 sm:p-6">
            <Field label="Fat %"><Input type="number" step="0.1" value={fat} onChange={(e) => setFat(e.target.value)} /></Field>
            <Field label="SNF %"><Input type="number" step="0.05" value={snf} onChange={(e) => setSnf(e.target.value)} /></Field>
            <Field label="Litres"><Input type="number" step="0.5" value={litres} onChange={(e) => setLitres(e.target.value)} /></Field>
            <div className="rounded-2xl bg-gradient-to-br from-brand to-accent p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-85">Rate per litre</p>
              <p className="font-display text-4xl font-extrabold tnum">{inr(rate, 2)}</p>
              <p className="mt-2 text-sm opacity-90">Amount for {litres || 0} L: <b>{inr(rate * (Number(litres) || 0), 2)}</b></p>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Fat x SNF price grid" subtitle="Darker cell means a higher rate per litre (Rs)" />
          <div className="overflow-x-auto p-4 sm:p-5">
            <table className="w-full min-w-[520px] border-separate border-spacing-1.5 text-center text-sm">
              <thead><tr><th className="p-2 text-xs text-mute">Fat \ SNF</th>{SNFS.map((s) => <th key={s} className="rounded-lg bg-soft p-2 font-bold">{s.toFixed(2)}</th>)}</tr></thead>
              <tbody>
                {FATS.map((f) => (
                  <tr key={f}>
                    <th className="rounded-lg bg-soft p-2 font-bold">{f.toFixed(1)}</th>
                    {SNFS.map((s) => {
                      const r = rateOf(f, s);
                      const t = (r - min) / (max - min);
                      const hit = Math.abs(f - Number(fat)) < 0.26 && Math.abs(s - Number(snf)) < 0.13;
                      return <td key={s} className={'rounded-lg p-2 font-semibold tnum transition-transform hover:scale-105 ' + (hit ? 'ring-2 ring-ink' : '')} style={{ background: 'rgb(var(--brand) / ' + (0.1 + t * 0.75).toFixed(2) + ')', color: t > 0.55 ? '#fff' : 'inherit' }}>{r.toFixed(2)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RateChart;
