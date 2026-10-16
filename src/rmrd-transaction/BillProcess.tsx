import { useCallback, useEffect, useMemo, useState } from 'react';
import { billProcessService } from '../services/bill-process.service';
import { useToast } from '../context/ToastContext';
import { Search, Save, RefreshCw, Trash2, Printer } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Input, Select } from '../components/ui/Fields';

type BillCycle = {
    BillCycleId: number;
    BillCycle: string;
    FromDate: string;
    ToDate: string;
};

type DeductionColumn = {
    columnId: string;
    key: string;
    name: string;
    code: number;
};

type BillRow = {
    ProcessId?: number;
    FarmerId?: number;
    FarmerName?: string;
    CowLiter?: number;
    BuffLiter?: number;
    MixLiter?: number;
    TotalLiter?: number;
    BillAmount?: number;
    TotalAddition?: number;
    TotalDeduction?: number;
    GrandTotal?: number;
    [key: string]: any;
};

const FIXED_COLUMNS = [
    { key: 'ProcessId', label: 'Process Id' },
    { key: 'FarmerId', label: 'Farmer Id' },
    { key: 'FarmerName', label: 'Farmer Name' },
    { key: 'CowLiter', label: 'C Ltr' },
    { key: 'BuffLiter', label: 'B Ltr' },
    { key: 'MixLiter', label: 'M Ltr' },
    { key: 'TotalLiter', label: 'Total Liter' },
    { key: 'BillAmount', label: 'Bill Amount' },
];

const FINAL_COLUMNS = [
    { key: 'TotalAddition', label: 'Total Addition' },
    { key: 'TotalDeduction', label: 'Total Deduction' },
    { key: 'GrandTotal', label: 'Final Amount' },
];

function todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateString(value: string | Date) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return todayString();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatAmount(value: unknown) {
    return (Number(value) || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function getArray(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.Table)) return value.Table;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.Data)) return value.Data;
    if (Array.isArray(value?.result)) return value.result;
    if (Array.isArray(value?.Result)) return value.Result;
    return [];
}

function getMessage(value: any, fallback: string) {
    return value?.message || value?.Message || fallback;
}

/**
 * ✅ MULTI-CASE KEY RESOLVER
 * API कोणत्याही case मध्ये key पाठवो (PascalCase / camelCase / snake_case / UPPER),
 * हे function योग्य value शोधून देते.
 */
function pickValue(obj: any, ...candidates: string[]): any {
    if (!obj) return undefined;

    for (const key of candidates) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
            return obj[key];
        }
    }

    // case-insensitive fallback
    const lowered = candidates.map(c => c.toLowerCase().replace(/[_\s]/g, ''));
    for (const actualKey of Object.keys(obj)) {
        const normalized = actualKey.toLowerCase().replace(/[_\s]/g, '');
        if (lowered.includes(normalized)) {
            const v = obj[actualKey];
            if (v !== undefined && v !== null && v !== '') return v;
        }
    }

    return undefined;
}

/** Value bind करताना null/undefined/empty ला '-' दाखवा, 0 पण 0 दाखवा */
function displayValue(raw: any, isNumericColumn: boolean): string | number {
    if (raw === null || raw === undefined || raw === '') return '-';
    if (isNumericColumn) return formatAmount(raw);
    return raw;
}

export default function BillProcess() {
    const toast = useToast();

    const [billCycles, setBillCycles] = useState<BillCycle[]>([]);
    const [billCycleId, setBillCycleId] = useState('');
    const [fromDate, setFromDate] = useState(todayString());
    const [toDate, setToDate] = useState(todayString());

    const [records, setRecords] = useState<BillRow[]>([]);
    const [deductionColumns, setDeductionColumns] = useState<DeductionColumn[]>([]);
    const [processId, setProcessId] = useState(0);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [printing, setPrinting] = useState(false);

    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [sortField, setSortField] = useState('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const branchId = localStorage.getItem('combinedId') || '';
    const userId = Number(localStorage.getItem('userId')) || 0;
    const companyId = localStorage.getItem('companyId') || '0';

    // ---------------- BILL CYCLES ----------------
    const loadBillCycles = useCallback(async () => {
        if (!branchId) {
            setBillCycles([]);
            return;
        }

        try {
            const response = await billProcessService.getBillCycles(branchId);
            const data = getArray(response);
            setBillCycles(data);

            if (data.length > 0) {
                const first = data[0];
                setBillCycleId(String(pickValue(first, 'BillCycleId', 'billCycleId', 'bill_cycle_id') ?? ''));
                setFromDate(dateString(pickValue(first, 'FromDate', 'fromDate', 'from_date') ?? todayString()));
                setToDate(dateString(pickValue(first, 'ToDate', 'toDate', 'to_date') ?? todayString()));
            } else {
                setBillCycleId('');
            }
        } catch (error) {
            console.error('Bill cycle API error:', error);
            setBillCycles([]);
            toast?.('Unable to load bill cycles');
        }
    }, [branchId, toast]);

    useEffect(() => {
        void loadBillCycles();
    }, [loadBillCycles]);

    const handleBillCycleChange = (value: string) => {
        setBillCycleId(value);
        const cycle = billCycles.find(item => String(pickValue(item, 'BillCycleId', 'billCycleId')) === String(value));
        if (cycle) {
            setFromDate(dateString(pickValue(cycle, 'FromDate', 'fromDate') ?? todayString()));
            setToDate(dateString(pickValue(cycle, 'ToDate', 'toDate') ?? todayString()));
        }
    };

    // ---------------- SEARCH ----------------
    const searchBills = useCallback(async () => {
        if (!branchId) {
            toast?.('Please select a branch');
            return;
        }
        if (!fromDate || !toDate) {
            toast?.('Please select From Date and To Date');
            return;
        }
        if (fromDate > toDate) {
            toast?.('From Date cannot be greater than To Date');
            return;
        }

        setLoading(true);

        try {
            const response = await billProcessService.getPendingList(branchId, fromDate, toDate);
            const data = getArray(response);

            // 🔍 Debug — काढून टाका production मध्ये
            console.log('🔍 Pending list data:', data);
            console.log('🔍 First row keys:', data[0] ? Object.keys(data[0]) : 'No data');

            setRecords(data);
            setProcessId(Number(pickValue(data[0], 'ProcessId', 'processId', 'process_id')) || 0);
            setPageIndex(0);

            const dynamicColumns: DeductionColumn[] = [];

            if (data.length > 0) {
                Object.keys(data[0]).forEach(key => {
                    const match = key.match(/^(.+?)-\((\d+)\)( Amount)?$/);
                    if (match) {
                        const isAmount = Boolean(match[3]);
                        dynamicColumns.push({
                            columnId: `ded_${match[2]}${isAmount ? '_amount' : ''}`,
                            key,
                            name: `${match[1].trim()}${isAmount ? ' Amount' : ''}`,
                            code: Number(match[2]),
                        });
                    }
                });
            }

            setDeductionColumns(dynamicColumns);
        } catch (error) {
            console.error('Bill list API error:', error);
            setRecords([]);
            setDeductionColumns([]);
            setProcessId(0);
            toast?.('Unable to load bill list');
        } finally {
            setLoading(false);
        }
    }, [branchId, fromDate, toDate, toast]);

    // ---------------- SORT ----------------
    const sortedRecords = useMemo(() => {
        const result = [...records];
        if (!sortField) return result;

        result.sort((a, b) => {
            const first = a[sortField];
            const second = b[sortField];
            const comparison =
                typeof first === 'number' || typeof second === 'number'
                    ? (Number(first) || 0) - (Number(second) || 0)
                    : String(first ?? '').localeCompare(String(second ?? ''));
            return sortDirection === 'asc' ? comparison : -comparison;
        });
        return result;
    }, [records, sortField, sortDirection]);

    const pageCount = Math.ceil(sortedRecords.length / pageSize);

    const pagedRecords = useMemo(() => {
        const start = pageIndex * pageSize;
        return sortedRecords.slice(start, start + pageSize);
    }, [sortedRecords, pageIndex, pageSize]);

    const changeSort = (key: string) => {
        if (sortField === key) {
            setSortDirection(old => (old === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(key);
            setSortDirection('asc');
        }
    };

    // ---------------- SAVE ----------------
    const saveBillProcess = async () => {
        if (records.length === 0) {
            toast?.('No data available to save.');
            return;
        }
        if (processId !== 0) {
            toast?.('Bill cycle already processed!');
            return;
        }
        if (!billCycleId) {
            toast?.('Please select a bill cycle');
            return;
        }

        const branch = Number(branchId) || 0;
        const currentDateTime = new Date().toISOString();

        const details = records.map(row => ({
            processId: 0,
            branchId: branch,
            farmerId: Number(pickValue(row, 'FarmerId', 'farmerId', 'farmer_id')) || 0,
            cowLiter: Number(pickValue(row, 'CowLiter', 'cowLiter', 'cow_liter')) || 0,
            buffLiter: Number(pickValue(row, 'BuffLiter', 'buffLiter', 'buff_liter')) || 0,
            mixLiter: Number(pickValue(row, 'MixLiter', 'mixLiter', 'mix_liter')) || 0,
            totalLiter: Number(pickValue(row, 'TotalLiter', 'totalLiter', 'total_liter')) || 0,
            billAmount: Number(pickValue(row, 'BillAmount', 'billAmount', 'bill_amount')) || 0,
            totalAddition: Number(pickValue(row, 'TotalAddition', 'totalAddition', 'total_addition')) || 0,
            totalDeduction: Number(pickValue(row, 'TotalDeduction', 'totalDeduction', 'total_deduction')) || 0,
            finalAmount: Number(pickValue(row, 'GrandTotal', 'grandTotal', 'FinalAmount', 'finalAmount', 'grand_total')) || 0,
        }));

        const ddDetails: any[] = [];
        records.forEach(row => {
            deductionColumns.forEach(column => {
                const amount = Number(row[column.key]) || 0;
                if (amount > 0) {
                    ddDetails.push({
                        processId: 0,
                        branchId: branch,
                        farmerId: Number(pickValue(row, 'FarmerId', 'farmerId')) || 0,
                        deductionCode: column.code,
                        deductionAmount: amount,
                    });
                }
            });
        });

        const payload = {
            processId: 0,
            branchId: branch,
            billCycleId: Number(billCycleId) || 0,
            fromDate,
            toDate,
            createdBy: userId,
            createdDateTime: currentDateTime,
            modifyBy: userId,
            modifyDateTime: currentDateTime,
            companyId,
            details,
            ddDetails,
        };

        setSaving(true);

        try {
            const response = await billProcessService.saveBillProcess(payload);
            toast?.(getMessage(response, 'Data Saved Successfully'));
            setRecords([]);
            setDeductionColumns([]);
            setProcessId(0);
            await loadBillCycles();
        } catch (error) {
            console.error('Save bill process error:', error);
            toast?.('Unable to save data');
        } finally {
            setSaving(false);
        }
    };

    // ---------------- DELETE ----------------
    const confirmDelete = async () => {
        if (!processId) {
            toast?.('Please search and load a processed bill first');
            return;
        }
        setShowDeleteModal(false);

        try {
            const response = await billProcessService.deleteBillProcess(processId);
            toast?.(getMessage(response, 'Deleted Successfully'));
            setRecords([]);
            setDeductionColumns([]);
            setProcessId(0);
            await loadBillCycles();
        } catch (error) {
            console.error('Delete bill process error:', error);
            toast?.('Delete Failed');
        }
    };

    const resetForm = async () => {
        setRecords([]);
        setDeductionColumns([]);
        setProcessId(0);
        setPageIndex(0);
        setSortField('');
        setSortDirection('asc');
        await loadBillCycles();
    };

    // ---------------- PRINT ----------------
    const printBill = async () => {
        if (records.length === 0) {
            toast?.('No records loaded to print');
            return;
        }
        if (!processId) {
            toast?.('ProcessId not found. Please process the bill first.');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast?.('Please allow popups for this site to print bills');
            return;
        }

        setPrinting(true);

        try {
            const response = await billProcessService.getFarmerBillReport(branchId, processId, fromDate, toDate);
            const report = response;
            const reportData = typeof report === 'string' ? JSON.parse(report) : report;

            // 🔍 Debug — काढून टाका production मध्ये
            console.log('🔍 Report Data:', reportData);
            console.log('🔍 First farmer:', reportData?.farmers?.[0]);
            console.log('🔍 First deduction:', reportData?.farmers?.[0]?.deductions?.[0]);
            console.log('🔍 First daily entry:', reportData?.farmers?.[0]?.dailyEntries?.[0]);

            const company = reportData?.company;
            const billProcess = reportData?.billProcess || {};
            const farmers = reportData?.farmers || [];

            if (!farmers.length) {
                printWindow.close();
                toast?.('No farmer bills found for this period');
                return;
            }

            const displayDate = (value: any) => {
                if (!value) return '-';
                const d = new Date(value);
                if (Number.isNaN(d.getTime())) return String(value);
                return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            };

            const escapeHtml = (value: any) =>
                String(value ?? '-').replace(/[&<>"']/g, char => ({
                    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
                }[char] || char));

            const money = (value: any) => formatAmount(value);
            const pages: string[] = [];

            for (let i = 0; i < farmers.length; i += 2) {
                const pair = farmers.slice(i, i + 2);

                const cards = pair.map((farmer: any) => {
                    const summary = farmer.summary || {};
                    const deductions = farmer.deductions || [];

                    // ✅ multi-case support
                    const dailyRows = (farmer.dailyEntries || []).map((entry: any) => {
                        const date = pickValue(entry, 'date', 'Date');
                        const milkType = pickValue(entry, 'milkType', 'MilkType');
                        const shift = pickValue(entry, 'shift', 'Shift');
                        const weight = pickValue(entry, 'weightKilo', 'WeightKilo', 'weightLiter', 'WeightLiter');
                        const fat = pickValue(entry, 'fat', 'Fat');
                        const snf = pickValue(entry, 'snf', 'SNF', 'Snf');
                        const rate = pickValue(entry, 'rate', 'Rate');
                        const amt = pickValue(entry, 'amt', 'Amt', 'amount', 'Amount');

                        return `
                            <tr>
                                <td>${escapeHtml(displayDate(date))}</td>
                                <td>${escapeHtml(milkType ?? '-')}</td>
                                <td>${escapeHtml(shift ?? '-')}</td>
                                <td>${money(weight)}</td>
                                <td>${money(fat)}</td>
                                <td>${money(snf)}</td>
                                <td>${money(rate)}</td>
                                <td>${money(amt)}</td>
                            </tr>
                        `;
                    }).join('');

                    const deductionRows = deductions.map((item: any) => {
                        const name = pickValue(item, 'deductionName', 'DeductionName', 'name', 'Name');
                        const type = pickValue(item, 'type', 'Type');
                        const amount = pickValue(item, 'amount', 'Amount');

                        return `
                            <tr>
                                <td>${escapeHtml(name)}</td>
                                <td>${escapeHtml(String(type).toUpperCase() === 'A' ? 'Addition' : 'Deduction')}</td>
                                <td class="number">${money(amount)}</td>
                            </tr>
                        `;
                    }).join('');

                    const farmerId = pickValue(farmer, 'farmerId', 'FarmerId');
                    const farmerName = pickValue(farmer, 'farmerName', 'FarmerName');

                    return `
                        <section class="bill-card">
                            <header>
                                <div>
                                    <h2>${escapeHtml(pickValue(company, 'name', 'Name'))}</h2>
                                    <p>${escapeHtml(pickValue(company, 'address', 'Address'))}</p>
                                </div>
                                <div class="company-right">
                                    <p>${escapeHtml(pickValue(company, 'phone', 'Phone'))}</p>
                                    <p>GSTIN: ${escapeHtml(pickValue(company, 'gst', 'Gst', 'GST'))}</p>
                                </div>
                            </header>

                            <div class="bill-title">
                                <strong>Farmer Milk Bill</strong>
                                <span>${displayDate(pickValue(billProcess, 'fromDate', 'FromDate'))} To ${displayDate(pickValue(billProcess, 'toDate', 'ToDate'))}</span>
                            </div>

                            <p><b>Farmer ID:</b> ${escapeHtml(farmerId)}
                               &nbsp;&nbsp; <b>Farmer Name:</b> ${escapeHtml(farmerName)}</p>

                            <h3>Daily Collection</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th><th>Milk</th><th>Shift</th>
                                        <th>Weight</th><th>Fat</th><th>SNF</th><th>Rate</th><th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>${dailyRows || '<tr><td colspan="8">No daily entries found</td></tr>'}</tbody>
                            </table>

                            <div class="summary">
                                <div>
                                    <h3>Collection Summary</h3>
                                    <table>
                                        <tbody>
                                            <tr><td>Cow Liter</td><td class="number">${money(pickValue(summary, 'cowLiter', 'CowLiter'))}</td></tr>
                                            <tr><td>Buff Liter</td><td class="number">${money(pickValue(summary, 'buffLiter', 'BuffLiter'))}</td></tr>
                                            <tr><td>Mix Liter</td><td class="number">${money(pickValue(summary, 'mixLiter', 'MixLiter'))}</td></tr>
                                            <tr><td>Total Liter</td><td class="number">${money(pickValue(summary, 'totalLiter', 'TotalLiter'))}</td></tr>
                                            <tr><td>Bill Amount</td><td class="number">${money(pickValue(summary, 'billAmount', 'BillAmount'))}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div>
                                    <h3>Additions & Deductions</h3>
                                    <table>
                                        <thead><tr><th>Name</th><th>Type</th><th>Amount</th></tr></thead>
                                        <tbody>${deductionRows || '<tr><td colspan="3">No additions or deductions</td></tr>'}</tbody>
                                    </table>
                                </div>
                            </div>

                            <div class="net">
                                <strong>Net Payment</strong>
                                <strong>₹ ${money(pickValue(summary, 'finalAmount', 'FinalAmount', 'grandTotal', 'GrandTotal'))}</strong>
                            </div>

                            <footer>
                                <span>Center Incharge Signature</span>
                                <span>Producer Signature</span>
                            </footer>
                        </section>
                    `;
                }).join('<div class="divider"></div>');

                pages.push(`<main class="bill-page">${cards}</main>`);
            }

            printWindow.document.open();
            printWindow.document.write(`
                <!doctype html>
                <html>
                <head>
                    <meta charset="utf-8" />
                    <title>Farmer Bill</title>
                    <style>
                        * { box-sizing: border-box; }
                        body { margin: 0; font-family: Arial, sans-serif; color: #111; }
                        .bill-page { width: 210mm; min-height: 297mm; margin: auto; padding: 8mm; page-break-after: always; }
                        .bill-page:last-child { page-break-after: auto; }
                        .bill-card { break-inside: avoid; page-break-inside: avoid; }
                        header { display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 5px; }
                        h2 { margin: 0; font-size: 17px; }
                        header p { margin: 3px 0; font-size: 10px; }
                        .company-right { text-align: right; }
                        .bill-title { display: flex; justify-content: space-between; margin: 10px 0 5px; font-size: 12px; }
                        h3 { font-size: 11px; margin: 7px 0 3px; }
                        p { font-size: 11px; }
                        table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 5px; }
                        th, td { border: 1px solid #222; padding: 3px; }
                        th { background: #eee; }
                        .number { text-align: right; }
                        .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                        .net { display: flex; justify-content: space-between; border-top: 2px solid; border-bottom: 2px solid; padding: 6px; margin: 6px 0; font-size: 12px; }
                        footer { display: flex; justify-content: space-between; gap: 20px; margin-top: 15px; }
                        footer span { width: 45%; border-top: 1px solid; text-align: center; padding-top: 4px; font-size: 10px; }
                        .divider { border-top: 1px dashed #222; margin: 10px 0; }
                        @page { size: A4; margin: 8mm; }
                        @media print { .bill-page { width: 100%; min-height: 0; padding: 0; margin: 0; } }
                    </style>
                </head>
                <body>${pages.join('')}</body>
                </html>
            `);
            printWindow.document.close();
        } catch (error) {
            console.error('Print bill error:', error);
            printWindow.close();
            toast?.('Failed to load report data');
        } finally {
            setPrinting(false);
        }
    };

    const columns = [
        ...FIXED_COLUMNS,
        ...deductionColumns.map(item => ({ key: item.key, label: item.name })),
        ...FINAL_COLUMNS,
    ];

    // ---------------- RENDER ----------------
    return (
        <div className="space-y-5">

            <PageHeader
                title="MCC Bill Process"
                subtitle="Manage bill cycles, farmer payments and deductions."
            />

            {/* Filter Card */}
            <Card className="p-4">
                <div className="grid gap-4 md:grid-cols-4">
                    <label className="text-sm">
                        <span className="mb-1 block">Bill Cycle *</span>
                        <Select
                            value={billCycleId}
                            onChange={e => handleBillCycleChange(e.target.value)}
                        >
                            <option value="">Select Bill Cycle</option>
                            {billCycles.map(cycle => (
                                <option key={cycle.BillCycleId} value={cycle.BillCycleId}>
                                    {cycle.BillCycle}
                                </option>
                            ))}
                        </Select>
                    </label>

                    <label className="text-sm">
                        <span className="mb-1 block">From Date *</span>
                        <Input
                            type="date"
                            value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                        />
                    </label>

                    <label className="text-sm">
                        <span className="mb-1 block">To Date *</span>
                        <Input
                            type="date"
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                        />
                    </label>

                    <div className="flex items-end gap-2">
                        <Button
                            icon={<Search size={16} />}
                            disabled={loading || saving}
                            onClick={() => void searchBills()}
                        >
                            {loading ? 'Loading...' : 'Search'}
                        </Button>

                        <Button
                            variant="outline"
                            icon={<RefreshCw size={16} />}
                            disabled={loading || saving}
                            onClick={() => void resetForm()}
                        >
                            Reset
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Records Table Card */}
            <Card>
                <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
                    <div>
                        <h2 className="font-semibold">Bill Records</h2>
                        <p className="mt-1 text-sm text-mute">
                            Pending farmer bill details with additions & deductions
                        </p>
                    </div>

                    <span className="ml-auto text-sm text-mute">
                        {records.length} records
                    </span>

                    <Button
                        variant="outline"
                        disabled={!processId || printing}
                        icon={<Trash2 size={16} />}
                        onClick={() => setShowDeleteModal(true)}
                    >
                        Delete
                    </Button>

                    <Button
                        variant="outline"
                        disabled={printing || records.length === 0}
                        icon={<Printer size={16} />}
                        onClick={() => void printBill()}
                    >
                        {printing ? 'Preparing...' : 'Print Bill'}
                    </Button>

                    <Button
                        disabled={loading || saving || records.length === 0}
                        icon={<Save size={16} />}
                        onClick={() => void saveBillProcess()}
                    >
                        {saving ? 'Saving...' : 'Save All'}
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-line text-left">
                                {columns.map(column => (
                                    <th
                                        key={column.key}
                                        className="whitespace-nowrap px-4 py-3 font-semibold"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => changeSort(column.key)}
                                            className="inline-flex items-center gap-1"
                                        >
                                            {column.label}
                                            {sortField === column.key && (
                                                <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-10 text-center text-mute">
                                        <div className="flex items-center justify-center gap-3">
                                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                            Loading bill records...
                                        </div>
                                    </td>
                                </tr>
                            ) : pagedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-10 text-center text-mute">
                                        No records found
                                    </td>
                                </tr>
                            ) : (
                                pagedRecords.map((record, index) => (
                                    <tr
                                        key={`${record.FarmerId ?? 'farmer'}-${index}`}
                                        className="border-b border-line hover:bg-blue-50/50"
                                    >
                                        {columns.map(column => {
                                            const raw = record[column.key];

                                            // ✅ Name column
                                            if (column.key === 'FarmerName') {
                                                const name = pickValue(record, 'FarmerName', 'farmerName', 'farmer_name');
                                                return (
                                                    <td key={column.key} className="whitespace-nowrap px-4 py-3">
                                                        <span
                                                            title={String(name ?? '')}
                                                            className="block max-w-56 truncate"
                                                        >
                                                            {name ?? '-'}
                                                        </span>
                                                    </td>
                                                );
                                            }

                                            // ✅ ID columns (numbers as-is)
                                            if (['FarmerId', 'ProcessId'].includes(column.key)) {
                                                const id = pickValue(record, column.key, column.key.toLowerCase());
                                                return (
                                                    <td key={column.key} className="whitespace-nowrap px-4 py-3">
                                                        {displayValue(id, false)}
                                                    </td>
                                                );
                                            }

                                            // ✅ All other numeric columns
                                            return (
                                                <td key={column.key} className="whitespace-nowrap px-4 py-3">
                                                    {displayValue(raw, true)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4 text-sm">
                    <span className="text-mute">
                        Total Records: {records.length}
                    </span>

                    <div className="flex items-center gap-3">
                        <select
                            className="rounded-lg border border-line px-2 py-1.5"
                            value={pageSize}
                            onChange={e => {
                                setPageSize(Number(e.target.value));
                                setPageIndex(0);
                            }}
                        >
                            {[10, 20, 50].map(size => (
                                <option key={size} value={size}>{size} rows</option>
                            ))}
                        </select>

                        <button
                            type="button"
                            disabled={pageIndex === 0}
                            onClick={() => setPageIndex(0)}
                            className="rounded border border-line px-3 py-1.5 disabled:opacity-40"
                        >
                            First
                        </button>

                        <button
                            type="button"
                            disabled={pageIndex === 0}
                            onClick={() => setPageIndex(p => Math.max(0, p - 1))}
                            className="rounded border border-line px-3 py-1.5 disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <span>{pageCount === 0 ? 0 : pageIndex + 1} / {pageCount}</span>

                        <button
                            type="button"
                            disabled={pageIndex >= pageCount - 1}
                            onClick={() => setPageIndex(p => Math.min(pageCount - 1, p + 1))}
                            className="rounded border border-line px-3 py-1.5 disabled:opacity-40"
                        >
                            Next
                        </button>

                        <button
                            type="button"
                            disabled={pageIndex >= pageCount - 1}
                            onClick={() => setPageIndex(Math.max(0, pageCount - 1))}
                            className="rounded border border-line px-3 py-1.5 disabled:opacity-40"
                        >
                            Last
                        </button>
                    </div>
                </div>
            </Card>

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-900">Confirm Delete</h3>
                        <p className="mt-2 text-sm text-slate-600">
                            Are you sure you want to delete this bill process?
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                No
                            </Button>

                            <Button
                                onClick={() => void confirmDelete()}
                            >
                                Yes, Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}