import type * as React from 'react';
import { ListPage } from '../components/ListPage';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useData } from '../context/DataContext';
import { inr } from '../lib/format';
import type { Employee } from '../types';

const DEPTS = ['Management', 'Accounts', 'Quality', 'Gate', 'Reception', 'Processing', 'Stores', 'Transport', 'Sales'];

const HR: React.FC = () => {
  const { db, add, patch, nextId } = useData();
  const present = db.employees.filter((e) => e.present).length;
  return (
    <ListPage<Employee>
      title="HR and payroll"
      subtitle="Staff list, today attendance and monthly salary."
      rows={db.employees}
      csvName="employees"
      addLabel="Add employee"
      stats={[
        { label: 'Headcount', value: String(db.employees.length) },
        { label: 'Present today', value: String(present), tone: 'text-ok' },
        { label: 'Absent today', value: String(db.employees.length - present), tone: 'text-danger' },
        { label: 'Monthly payroll', value: inr(db.employees.reduce((s, e) => s + e.salary, 0)) },
      ]}
      filter={{ label: 'Department', get: (r) => r.dept, options: DEPTS }}
      fields={[
        { key: 'name', label: 'Employee name' },
        { key: 'dept', label: 'Department', type: 'select', options: DEPTS },
        { key: 'role', label: 'Role' },
        { key: 'salary', label: 'Monthly salary (INR)', type: 'number' },
      ]}
      onAdd={(v) => add('employees', { id: nextId('E'), name: v.name, dept: v.dept, role: v.role, salary: Number(v.salary), present: true })}
      columns={[
        { key: 'name', header: 'Employee', cell: (r) => <span className="font-semibold">{r.name}</span>, sort: (r) => r.name },
        { key: 'dept', header: 'Department', cell: (r) => r.dept },
        { key: 'role', header: 'Role', cell: (r) => r.role },
        { key: 'sal', header: 'Salary', align: 'right', cell: (r) => inr(r.salary), sort: (r) => r.salary },
        { key: 'pf', header: 'PF (12%)', align: 'right', cell: (r) => inr(Math.round(r.salary * 0.12)) },
        { key: 'net', header: 'Net pay', align: 'right', cell: (r) => <span className="font-bold">{inr(r.salary - Math.round(r.salary * 0.12))}</span> },
        { key: 'att', header: 'Today', cell: (r) => <Badge dot tone={r.present ? 'ok' : 'danger'}>{r.present ? 'Present' : 'Absent'}</Badge> },
        { key: 'act', header: '', align: 'right', cell: (r) => <Button size="sm" variant="soft" onClick={() => patch('employees', r.id, { present: !r.present })}>{r.present ? 'Mark absent' : 'Mark present'}</Button> },
      ]}
    />
  );
};

export default HR;
