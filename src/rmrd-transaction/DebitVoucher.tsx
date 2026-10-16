
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type FormEvent,
} from 'react';

import {
    Search,
    Save,
    RefreshCw,
    X,
    Pencil,
    Trash2,
    Plus,
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Input } from '../components/ui/Fields';
import { useToast } from '../context/ToastContext';
import { todayISO } from '../lib/format';

import {
    getVoucherList,
    getVoucherById,
    saveVoucher,
    deleteVoucher,
    getVoucherAccounts,
    getDeductionTypes,
} from '../services/debitVoucher.service';

type Voucher = {
    VoucherId?: number;
    voucherId?: number;
    AccountType1?: string;
    AcName?: string;
    DeductionName?: string;
    Amount?: number;
    [key: string]: any;
};

type VoucherForm = {
    trDate: string;
    cmbdeduction: string;
    actype: string;
    farmer: string;
    amount: string;
    details: string;
};

const initialForm = (): VoucherForm => ({
    trDate: todayISO(),
    cmbdeduction: '',
    actype: 'C',
    farmer: '',
    amount: '',
    details: '',
});

function getArray(data: any): any[] {
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch {
            return [];
        }
    }

    if (Array.isArray(data)) return data;

    if (data?.Table && Array.isArray(data.Table)) return data.Table;
    if (data?.data !== undefined) return getArray(data.data);
    if (data?.Data !== undefined) return getArray(data.Data);
    if (data?.result !== undefined) return getArray(data.result);
    if (data?.Result !== undefined) return getArray(data.Result);

    return [];
}

function getObject(data: any): any {
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch {
            return {};
        }
    }

    if (Array.isArray(data)) return data[0] ?? {};
    if (data?.data !== undefined) return getObject(data.data);
    if (data?.Data !== undefined) return getObject(data.Data);

    return data ?? {};
}

function dateValue(value: any): string {
    if (!value) return todayISO();

    const text = String(value);

    if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
        return text.substring(0, 10);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return todayISO();

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

export default function DebitVoucher() {
    const toast = useToast();

    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [voucherList, setVoucherList] = useState<Voucher[]>([]);
    const [deductionData, setDeductionData] = useState<any[]>([]);
    const [accountList, setAccountList] = useState<any[]>([]);

    const [fromDate, setFromDate] = useState(todayISO());
    const [toDate, setToDate] = useState(todayISO());

    const [form, setForm] = useState<VoucherForm>(initialForm());
    const [flag, setFlag] = useState(0);
    const [selectedVoucherId, setSelectedVoucherId] = useState(0);

    const [deleteItem, setDeleteItem] = useState<Voucher | null>(null);

    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const detailsRef = useRef<HTMLInputElement>(null);
    const saveRef = useRef<HTMLButtonElement>(null);

    const branchId = localStorage.getItem('combinedId') || '';
    const userId = Number(localStorage.getItem('userId') || 0);
    const companyId = Number(localStorage.getItem('companyId') || 0);

    const updateField = (name: keyof VoucherForm, value: string) => {
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const loadList = useCallback(async () => {
        if (!branchId) {
            setVoucherList([]);
            return;
        }

        setLoading(true);

        try {
            const response = await getVoucherList(
                branchId,
                fromDate,
                toDate,
            );

            setVoucherList(getArray(response));
            setPageIndex(0);
        } catch (error) {
            console.error('Voucher List API error:', error);
            setVoucherList([]);

            toast(
                error instanceof Error
                    ? error.message
                    : 'Unable to load voucher list.',
            );
        } finally {
            setLoading(false);
        }
    }, [branchId, fromDate, toDate, toast]);

    const loadDropdowns = useCallback(async (accountType = 'C') => {
        try {
            const [deductions, accounts] = await Promise.all([
                getDeductionTypes(branchId),
                getVoucherAccounts(accountType),
            ]);

            setDeductionData(getArray(deductions));

            const accountData = getArray(accounts);
            const currentBranchId = Number(branchId);

            const branch = accountData
                .flatMap((firm: any) =>
                    firm?.Branches ?? firm?.branches ?? [],
                )
                .find(
                    (item: any) =>
                        Number(item?.BranchId ?? item?.branchId) ===
                        currentBranchId,
                );

            const mccList = branch?.MCC ?? branch?.mcc ?? [];

            const farmers = mccList
                .flatMap((mcc: any) => mcc?.Routes ?? mcc?.routes ?? [])
                .flatMap((route: any) =>
                    route?.Accounts ?? route?.accounts ?? [],
                );

            setAccountList(farmers);

            setForm((prev) => ({
                ...prev,
                farmer: farmers.some(
                    (item: any) =>
                        String(item.AcCode ?? item.acCode) === prev.farmer,
                )
                    ? prev.farmer
                    : '',
                cmbdeduction:
                    prev.cmbdeduction ||
                    String(
                        (getArray(deductions)[0]?.Code ??
                            getArray(deductions)[0]?.code) ??
                            '',
                    ),
            }));
        } catch (error) {
            console.error('Voucher dropdown API error:', error);
            setDeductionData([]);
            setAccountList([]);

            toast(
                error instanceof Error
                    ? error.message
                    : 'Unable to load dropdown data.',
            );
        }
    }, [branchId, toast]);

    useEffect(() => {
        void loadList();
    }, [loadList]);

    const openForm = () => {
        setFlag(0);
        setSelectedVoucherId(0);
        setForm(initialForm());
        setShowForm(true);

        void loadDropdowns('C');
    };

    const closeForm = () => {
        setShowForm(false);
        setForm(initialForm());
        setFlag(0);
        setSelectedVoucherId(0);
    };

    const resetForm = () => {
        setForm({
            ...initialForm(),
            cmbdeduction: String(
                deductionData[0]?.Code ?? deductionData[0]?.code ?? '',
            ),
        });
    };

    const handleAccountTypeChange = (value: string) => {
        setForm((prev) => ({
            ...prev,
            actype: value,
            farmer: '',
        }));

        void loadDropdowns(value);
    };

    const editVoucher = async (item: Voucher) => {
        const id = Number(item.VoucherId ?? item.voucherId ?? 0);

        if (!id) {
            toast('Voucher ID is missing.');
            return;
        }

        setLoading(true);

        try {
            const response = await getVoucherById(id);
            const data = getObject(response);

            setFlag(1);
            setSelectedVoucherId(id);

            const accountType = String(
                data.accounType ?? data.AccountType ?? 'C',
            );

            setForm({
                trDate: dateValue(data.voucherDate ?? data.VoucherDate),
                cmbdeduction: String(
                    data.deductionType ?? data.DeductionType ?? '',
                ),
                actype: accountType,
                farmer: String(data.acCode ?? data.AcCode ?? ''),
                amount: String(data.amount ?? data.Amount ?? ''),
                details: String(
                    data.narration ?? data.Narration ?? '',
                ),
            });

            setShowForm(true);

            await loadDropdowns(accountType);
        } catch (error) {
            console.error('Edit Voucher error:', error);

            toast(
                error instanceof Error
                    ? error.message
                    : 'Unable to open voucher.',
            );
        } finally {
            setLoading(false);
        }
    };

    const submitForm = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!form.actype || !form.farmer || !form.amount.trim() ||
            !form.details.trim()) {
            toast('Please fill all required fields.');
            return;
        }

        const amount = Number(form.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            toast('Enter a valid amount greater than zero.');
            return;
        }

        if (!form.trDate) {
            toast('Please select voucher date.');
            return;
        }

        const now = new Date().toISOString();

        const payload = {
            voucherId: flag === 1 ? selectedVoucherId : 0,
            branchId: Number(branchId),
            accounType: form.actype,
            voucherDate: form.trDate,
            acCode: Number(form.farmer),
            deductionType: form.cmbdeduction
                ? Number(form.cmbdeduction)
                : 0,
            amount,
            narration: form.details.trim(),
            createdBy: userId,
            createdDateTime: now,
            modifyBy: userId,
            modifyDateTime: now,
            companyId,
        };

        setSaving(true);

        try {
            const response = await saveVoucher(flag, payload);
            const result = getObject(response);

            toast(
                result?.message ??
                result?.Message ??
                (flag === 1
                    ? 'Voucher updated successfully.'
                    : 'Voucher saved successfully.'),
            );

            closeForm();
            await loadList();
        } catch (error) {
            console.error('Save Voucher error:', error);

            toast(
                error instanceof Error
                    ? error.message
                    : 'Unable to save voucher.',
            );
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteItem) return;

        const id = Number(
            deleteItem.VoucherId ?? deleteItem.voucherId ?? 0,
        );

        if (!id) {
            toast('Voucher ID is missing.');
            return;
        }

        setLoading(true);

        try {
            await deleteVoucher(id);
            setDeleteItem(null);
            toast('Voucher deleted successfully.');
            await loadList();
        } catch (error) {
            console.error('Delete Voucher error:', error);

            toast(
                error instanceof Error
                    ? error.message
                    : 'Unable to delete voucher.',
            );
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.max(
        1,
        Math.ceil(voucherList.length / pageSize),
    );

    const paginatedList = voucherList.slice(
        pageIndex * pageSize,
        (pageIndex + 1) * pageSize,
    );

    return (
        <div className="space-y-5">
            <PageHeader
                title={showForm ? 'Debit Voucher' : 'Voucher List'}
                subtitle="Manage debit vouchers, deductions and amounts."
                actions={
                    showForm ? (
                        <Button
                            variant="outline"
                            icon={<X size={16} />}
                            onClick={closeForm}
                        >
                            Close Form
                        </Button>
                    ) : (
                        <Button
                            icon={<Plus size={16} />}
                            onClick={openForm}
                        >
                            Add Voucher
                        </Button>
                    )
                }
            />

            {!showForm && (
                <>
                    <Card className="p-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <label className="text-sm">
                                <span className="mb-1 block font-bold text-slate-900">
                                    From Date
                                </span>
                                <Input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) =>
                                        setFromDate(e.target.value)
                                    }
                                />
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block font-bold text-slate-900">
                                    To Date
                                </span>
                                <Input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) =>
                                        setToDate(e.target.value)
                                    }
                                />
                            </label>

                            <div className="flex items-end gap-2">
                                <Button
                                    icon={<Search size={16} />}
                                    onClick={() => void loadList()}
                                >
                                    Search
                                </Button>

                                <Button
                                    variant="outline"
                                    icon={<RefreshCw size={16} />}
                                    onClick={() => {
                                        setFromDate(todayISO());
                                        setToDate(todayISO());
                                    }}
                                >
                                    Today
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
                            <h2 className="text-base font-bold">
                                Voucher List
                            </h2>
                            <span className="ml-auto text-sm text-mute">
                                {voucherList.length} records
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-line text-left">
                                        {[
                                            'V Id',
                                            'Ac Type',
                                            'Ac Name',
                                            'Ded Type',
                                            'Amount',
                                            'Actions',
                                        ].map((heading) => (
                                            <th
                                                key={heading}
                                                className="whitespace-nowrap px-4 py-3 font-semibold"
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-8 text-center"
                                            >
                                                Loading records...
                                            </td>
                                        </tr>
                                    ) : paginatedList.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-8 text-center text-mute"
                                            >
                                                No records found
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedList.map((item, index) => (
                                            <tr
                                                key={`${item.VoucherId ?? item.voucherId}-${index}`}
                                                className="border-b border-line"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {item.VoucherId ?? item.voucherId ?? '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {item.AccountType1 ?? item.accounType ?? '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {item.AcName ?? item.acName ?? '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {item.DeductionName ?? item.deductionName ?? '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {Number(item.Amount ?? item.amount ?? 0).toFixed(2)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => void editVoucher(item)}
                                                        >
                                                            <Pencil size={14} />
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setDeleteItem(item)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4">
                            <div className="flex items-center gap-2 text-sm text-mute">
                                <span>Rows:</span>

                                <select
                                    className="rounded-lg border border-line bg-transparent px-2 py-1"
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setPageIndex(0);
                                    }}
                                >
                                    {[10, 20, 50].map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>

                                <span>
                                    {voucherList.length === 0
                                        ? 0
                                        : pageIndex * pageSize + 1}
                                    {'–'}
                                    {Math.min(
                                        (pageIndex + 1) * pageSize,
                                        voucherList.length,
                                    )}
                                    {' of '}
                                    {voucherList.length}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    disabled={pageIndex === 0}
                                    onClick={() =>
                                        setPageIndex((p) => Math.max(0, p - 1))
                                    }
                                >
                                    Previous
                                </Button>

                                <Button
                                    variant="outline"
                                    disabled={pageIndex + 1 >= totalPages}
                                    onClick={() =>
                                        setPageIndex((p) => p + 1)
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </Card>
                </>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-6 py-4">
                            <div>
                                <h2 className="text-xl font-bold">
                                    {flag === 1 ? 'Edit Debit Voucher' : 'Add Debit Voucher'}
                                </h2>
                                <p className="mt-1 text-sm text-mute">
                                    Enter voucher details below.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                className="rounded-lg p-2 text-mute hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={(e) => void submitForm(e)}
                            onKeyDown={(e) => {
                                if (
                                    e.key === 'Enter' &&
                                    (e.target as HTMLElement).tagName !== 'BUTTON'
                                ) {
                                    e.preventDefault();
                                }
                            }}
                        >
                            <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
                                <label className="text-sm">
                                    <span className="mb-1 block font-bold text-slate-900">
                                        Date *
                                    </span>
                                    <Input
                                        type="date"
                                        value={form.trDate}
                                        onChange={(e) =>
                                            updateField('trDate', e.target.value)
                                        }
                                        required
                                    />
                                </label>

                                <label className="text-sm">
                                    <span className="mb-1 block font-bold text-slate-900">
                                        Deduction
                                    </span>
                                    <select
                                        className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
                                        value={form.cmbdeduction}
                                        onChange={(e) =>
                                            updateField('cmbdeduction', e.target.value)
                                        }
                                    >
                                        <option value="">Select Deduction</option>
                                        {deductionData.map((item, index) => (
                                            <option
                                                key={item.Code ?? item.code ?? index}
                                                value={item.Code ?? item.code}
                                            >
                                                {item.DeductionName ?? item.deductionName}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="text-sm">
                                    <span className="mb-1 block font-bold text-slate-900">
                                        Ac Type *
                                    </span>
                                    <select
                                        className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
                                        value={form.actype}
                                        required
                                        onChange={(e) =>
                                            handleAccountTypeChange(e.target.value)
                                        }
                                    >
                                        <option value="C">Customer</option>
                                        <option value="V">Vendor</option>
                                        <option value="F">Supplier</option>
                                        <option value="T">Tanker Party</option>
                                        <option value="E">Employee</option>
                                    </select>
                                </label>

                                <label className="text-sm">
                                    <span className="mb-1 block font-bold text-slate-900">
                                        Farmer / Account *
                                    </span>
                                    <select
                                        className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
                                        value={form.farmer}
                                        required
                                        onChange={(e) =>
                                            updateField('farmer', e.target.value)
                                        }
                                    >
                                        <option value="">Select Account</option>
                                        {accountList.map((item, index) => (
                                            <option
                                                key={item.AcCode ?? item.acCode ?? index}
                                                value={item.AcCode ?? item.acCode}
                                            >
                                                {item.AcName ?? item.acName}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="text-sm">
                                    <span className="mb-1 block font-bold text-slate-900">
                                        Amount *
                                    </span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={form.amount}
                                        onChange={(e) =>
                                            updateField('amount', e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                detailsRef.current?.focus();
                                            }
                                        }}
                                        required
                                    />
                                </label>

                                <label className="text-sm">
                                    <span className="mb-1 block font-bold text-slate-900">
                                        Details *
                                    </span>
                                    <Input
                                        value={form.details}
                                        onChange={(e) =>
                                            updateField(
                                                'details',
                                                e.target.value.replace(
                                                    /(^|\s)([a-z])/g,
                                                    (_, space, char) =>
                                                        space + char.toUpperCase(),
                                                ),
                                            )
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                saveRef.current?.focus();
                                            }
                                        }}
                                        required
                                    />
                                </label>
                            </div>

                            <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-line bg-slate-50 px-6 py-4">
                                <button
                                    ref={saveRef}
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <Save size={16} />
                                    {saving
                                        ? 'Saving...'
                                        : flag === 1
                                            ? 'Update'
                                            : 'Save'}
                                </button>

                                <Button
                                    variant="outline"
                                    icon={<RefreshCw size={16} />}
                                    onClick={resetForm}
                                    disabled={saving}
                                >
                                    Reset
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {deleteItem && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
                    <Card className="w-full max-w-md p-5">
                        <h2 className="text-lg font-bold">Confirm Delete</h2>

                        <p className="mt-3 text-sm text-mute">
                            Are you sure you want to delete voucher{' '}
                            {deleteItem.VoucherId ?? deleteItem.voucherId}?
                        </p>

                        <div className="mt-5 flex justify-end gap-3">
                            <Button
                                disabled={loading}
                                onClick={() => void confirmDelete()}
                            >
                                <Trash2 size={14} />
                                Delete
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setDeleteItem(null)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
