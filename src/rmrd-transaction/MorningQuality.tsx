import { useCallback, useEffect, useState, type FormEvent, } from 'react';
import { Search, Save, RefreshCw, X, Pencil, Trash2, } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Input } from '../components/ui/Fields';
import { useToast } from '../context/ToastContext';
import { nf, todayISO } from '../lib/format';
import { environment } from '../config/environment';
import { getPendingQualityList, getSavedQualityList, getPendingQualityById, getQualityById, saveMorningQuality, deleteMorningQuality, getQualityAccounts, } from '../services/morningQuality.service';

type QualityRow = {
    CodeNo: number;
    BranchId?: number;
    BranchName?: string;
    RouteId?: number;
    AcName?: string;
    MilkType?: string;
    Shift?: string;
    SampleNo?: number;
    WeightKilo?: number;
    WeightLiter?: number;
    Fat?: number;
    SNF?: number;
    [key: string]: any;
};

type QualityForm = {
    trDate: string;
    CodeNo: number;
    mcc: string;
    route: string;
    farmer: string;
    mccId: number;
    routeId: number;
    supCode: number;
    sampleNo: number;
    shift: string;
    milkType: string;
    fat: string;
    snf: string;
    txtdegree: string;
    water: string;
    clr: string;
    uria: string;
    ammonia: string;
    nitrate: string;
    starch: string;
    sugar: string;
    glucose: string;
    salt: string;
    neutral: string;
    hydrogen: string;
    formalin: string;
    protein: string;
    temperature: string;
    lacto: string;
    matter: string;
};

const initialForm = (): QualityForm => ({
    trDate: todayISO(),
    CodeNo: 0,
    mcc: '',
    route: '',
    farmer: '',
    mccId: 0,
    routeId: 0,
    supCode: 0,
    sampleNo: 0,
    shift: new Date().getHours() < 12 ? 'Morning' : 'Evening',
    milkType: 'Cow',
    fat: '',
    snf: '',
    txtdegree: '',
    water: '',
    clr: '',
    uria: '',
    ammonia: '',
    nitrate: '',
    starch: '',
    sugar: '',
    glucose: '',
    salt: '',
    neutral: '',
    hydrogen: '',
    formalin: '',
    protein: '',
    temperature: '',
    lacto: '',
    matter: '',
});

const getArray = (data: any): any[] => {
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch {
            return [];
        }
    }

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.Data)) return data.Data;
    if (Array.isArray(data?.result)) return data.result;
    if (Array.isArray(data?.Result)) return data.Result;

    return [];
};

const getObject = (data: any): any => {
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch {
            return {};
        }
    }

    if (Array.isArray(data)) return data[0] ?? {};

    if (data?.data !== undefined) {
        return getObject(data.data);
    }

    if (data?.Data !== undefined) {
        return getObject(data.Data);
    }

    return data ?? {};
};

const dateValue = (value: any) => {
    if (!value) return todayISO();

    const text = String(value);

    if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
        return text.substring(0, 10);
    }

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) return todayISO();

    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
    ].join('-');
};

const numeric = (value: unknown) => Number(value) || 0;

const milkLabel = (value?: string) => {
    const milk = String(value ?? '').toLowerCase();

    if (milk === 'c' || milk === 'cow') return 'Cow';
    if (milk === 'b' || milk === 'buff' || milk === 'buffalo') {
        return 'Buffalo';
    }

    if (milk === 'm' || milk === 'mix') return 'Mix';

    return value || '-';
};

const shiftLabel = (value?: string) => {
    const shift = String(value ?? '').toLowerCase();

    if (shift === 'm' || shift === 'morning') return 'M';
    if (shift === 'e' || shift === 'evening') return 'E';

    return value?.charAt(0) ?? '-';
};

export default function MorningQuality() {
    const toast = useToast();
    const apiUrl = environment.staticIP1;

    const [showPendingForm, setShowPendingForm] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showTable, setShowTable] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [pendingList, setPendingList] = useState<QualityRow[]>([]);
    const [qualityList, setQualityList] = useState<QualityRow[]>([]);
    const [accountsData, setAccountsData] = useState<any>({});

    const [pendingFrom, setPendingFrom] = useState(todayISO());
    const [pendingTo, setPendingTo] = useState(todayISO());
    const [savedFrom, setSavedFrom] = useState(todayISO());
    const [savedTo, setSavedTo] = useState(todayISO());

    const [form, setForm] = useState<QualityForm>(initialForm());
    const [flag, setFlag] = useState(0);
    const [deleteItem, setDeleteItem] = useState<QualityRow | null>(null);

    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const branchId = localStorage.getItem('combinedId') || '';
    const userId = Number(localStorage.getItem('userId') || 0);
    const companyId = Number(localStorage.getItem('companyId') || 0);

    const updateForm = (name: keyof QualityForm, value: string) => {
        setForm((prev) => {
            const next = { ...prev, [name]: value };

            if (name === 'fat' || name === 'snf') {
                const fat = Number(name === 'fat' ? value : next.fat);
                const snf = Number(name === 'snf' ? value : next.snf);

                if (next.fat !== '' && next.snf !== '') {
                    next.txtdegree = String(
                        Math.round((snf - 0.21 * fat - 0.36) * 40) / 10,
                    );
                }
            }

            return next;
        });
    };

    const loadPendingList = useCallback(async () => {
        if (!branchId) {
            setPendingList([]);
            return;
        }

        setIsLoading(true);

        try {
            const data = await getPendingQualityList(
                apiUrl,
                branchId,
                pendingFrom,
                pendingTo,
            );

            setPendingList(getArray(data));
            setPageIndex(0);
        } catch (error) {
            console.error('Pending Quality API error:', error);
            setPendingList([]);

            toast(
                error instanceof Error
                    ? error.message
                    : 'Unable to load pending quality.',
            );
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, branchId, pendingFrom, pendingTo, toast]);

    const loadSavedList = useCallback(async () => {
        if (!branchId) {
            setQualityList([]);
            return;
        }

        setIsLoading(true);

        try {
            const data = await getSavedQualityList(
                apiUrl,
                branchId,
                savedFrom,
                savedTo,
            );

            setQualityList(getArray(data));
            setPageIndex(0);
        } catch (error) {
            console.error('Saved Quality API error:', error);
            setQualityList([]);

            toast(
                error instanceof Error
                    ? error.message
                    : 'Unable to load saved quality.',
            );
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, branchId, savedFrom, savedTo, toast]);

    const loadAccounts = useCallback(async () => {
        try {
            const data = await getQualityAccounts(apiUrl);
            const firms = getArray(data);
            const firmId = Number(localStorage.getItem('firmId') || 0);

            const selectedFirm =
                firms.find(
                    (firm: any) =>
                        Number(firm.FirmId ?? firm.firmId) === firmId,
                ) ??
                firms[0] ??
                getObject(data);

            setAccountsData(selectedFirm);
        } catch (error) {
            console.error('Account API error:', error);

            toast(
                error instanceof Error
                    ? error.message
                    : 'Unable to load farmer accounts.',
            );
        }
    }, [apiUrl, toast]);

    useEffect(() => {
        void loadPendingList();
        void loadAccounts();
    }, [loadPendingList, loadAccounts]);

    const openNewForm = () => {
        setFlag(0);
        setForm(initialForm());
        setShowPendingForm(false);
        setShowTable(false);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setForm(initialForm());

        if (flag === 1) {
            setShowTable(true);
            setShowPendingForm(false);
        } else {
            setShowPendingForm(true);
            setShowTable(false);
        }
    };

    const openSavedList = async () => {
        setShowPendingForm(false);
        setShowForm(false);
        setShowTable(true);

        await loadSavedList();
    };

    const openPendingList = async () => {
        setShowTable(false);
        setShowForm(false);
        setShowPendingForm(true);

        await loadPendingList();
    };

    const editRecord = async (item: QualityRow, pending: boolean) => {
        setIsLoading(true);

        try {
            const response = pending
                ? await getPendingQualityById(apiUrl, item.CodeNo)
                : await getQualityById(apiUrl, item.CodeNo);

            const data = getObject(response);

            const branches =
                accountsData?.Branches ?? accountsData?.branches ?? [];

            const branch = branches.find(
                (b: any) =>
                    Number(b.BranchId ?? b.branchId) === Number(branchId),
            );

            const mccList = branch?.MCC ?? branch?.mcc ?? [];

            const mcc = mccList.find(
                (x: any) =>
                    Number(x.MCCId ?? x.mccId) === Number(data.mccId ?? data.MCCId),
            );

            const routes = mcc?.Routes ?? mcc?.routes ?? [];

            const route = routes.find(
                (x: any) =>
                    Number(x.RouteId ?? x.routeId) === Number(data.routeId ?? data.RouteId),
            );

            const farmers = route?.Accounts ?? route?.accounts ?? [];

            const farmer = farmers.find(
                (x: any) =>
                    Number(x.AcCode ?? x.acCode) === Number(data.supCode ?? data.SupCode),
            );

            const getValue = (lower: string, upper: string) =>
                data[lower] ?? data[upper];

            setFlag(pending ? 0 : 1);

            setForm({
                ...initialForm(),
                trDate: dateValue(getValue('trDate', 'TrDate')),
                CodeNo: Number(getValue('codeNo', 'CodeNo') ?? item.CodeNo),

                mcc: String(
                    mcc?.MCCName ??
                    mcc?.mccName ??
                    getValue('mccId', 'MCCId') ??
                    '',
                ),

                route: String(
                    route?.RouteName ??
                    route?.routeName ??
                    getValue('routeId', 'RouteId') ??
                    '',
                ),

                farmer: String(
                    farmer?.AcName ??
                    farmer?.acName ??
                    getValue('supCode', 'SupCode') ??
                    '',
                ),

                mccId: Number(getValue('mccId', 'MCCId') ?? 0),
                routeId: Number(getValue('routeId', 'RouteId') ?? 0),
                supCode: Number(getValue('supCode', 'SupCode') ?? 0),
                sampleNo: Number(getValue('sampleNo', 'SampleNo') ?? 0),

                shift:
                    getValue('shift', 'Shift') === 'M'
                        ? 'Morning'
                        : getValue('shift', 'Shift') === 'E'
                            ? 'Evening'
                            : getValue('shift', 'Shift') ?? 'Morning',

                milkType:
                    getValue('milkType', 'MilkType') === 'C'
                        ? 'Cow'
                        : getValue('milkType', 'MilkType') === 'B'
                            ? 'Buff'
                            : getValue('milkType', 'MilkType') === 'M'
                                ? 'Mix'
                                : getValue('milkType', 'MilkType') ?? 'Cow',

                fat: getValue('fat', 'Fat') == null ? '' : String(getValue('fat', 'Fat')),
                snf: getValue('snf', 'SNF') == null ? '' : String(getValue('snf', 'SNF')),

                txtdegree:
                    getValue('mbrt', 'MBRT') == null
                        ? ''
                        : String(getValue('mbrt', 'MBRT')),

                water: getValue('water', 'Water') == null ? '' : String(getValue('water', 'Water')),
                clr: getValue('clr', 'CLR') == null ? '' : String(getValue('clr', 'CLR')),
                uria: getValue('uria', 'Uria') == null ? '' : String(getValue('uria', 'Uria')),
                ammonia: getValue('ammonia', 'Ammonia') == null ? '' : String(getValue('ammonia', 'Ammonia')),
                nitrate: getValue('nitrate', 'Nitrate') == null ? '' : String(getValue('nitrate', 'Nitrate')),
                starch: getValue('starch', 'Starch') == null ? '' : String(getValue('starch', 'Starch')),
                sugar: getValue('sugar', 'Sugar') == null ? '' : String(getValue('sugar', 'Sugar')),
                glucose: getValue('glucose', 'Glucose') == null ? '' : String(getValue('glucose', 'Glucose')),
                salt: getValue('salt', 'Salt') == null ? '' : String(getValue('salt', 'Salt')),
                neutral: getValue('neutral', 'Neutral') == null ? '' : String(getValue('neutral', 'Neutral')),
                hydrogen: getValue('hydrogen', 'Hydrogen') == null ? '' : String(getValue('hydrogen', 'Hydrogen')),
                formalin: getValue('formalin', 'Formalin') == null ? '' : String(getValue('formalin', 'Formalin')),
                protein: getValue('protein', 'Protein') == null ? '' : String(getValue('protein', 'Protein')),
                temperature: getValue('temperature', 'Temperature') == null ? '' : String(getValue('temperature', 'Temperature')),
                lacto: getValue('lacto', 'Lacto') == null ? '' : String(getValue('lacto', 'Lacto')),
                matter: getValue('matter', 'Matter') == null ? '' : String(getValue('matter', 'Matter')),
            });

            setShowPendingForm(false);
            setShowTable(false);
            setShowForm(true);
        } catch (error) {
            console.error('Edit Quality error:', error);

            toast(
                error instanceof Error
                    ? error.message
                    : 'Unable to open record.',
            );
        } finally {
            setIsLoading(false);
        }
    };

    const submitForm = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (
            form.fat === '' ||
            form.snf === '' ||
            form.txtdegree === ''
        ) {
            toast('Fat, SNF and Degree are required.');
            return;
        }

        const now = new Date().toISOString();

        const payload = {
            CodeNo: flag === 0 ? 1 : Number(form.CodeNo || 0),
            branchId: Number(branchId),
            WeightCollectionId: Number(form.CodeNo || 0),
            mccId: form.mccId,
            routeId: form.routeId,
            trDate: form.trDate,
            supCode: form.supCode,
            sampleNo: Number(form.sampleNo || 0),

            milkType:
                form.milkType === 'Cow'
                    ? 'C'
                    : form.milkType === 'Buff' || form.milkType === 'Buffalo'
                        ? 'B'
                        : form.milkType === 'Mix'
                            ? 'M'
                            : form.milkType,

            shift:
                form.shift === 'Morning'
                    ? 'M'
                    : form.shift === 'Evening'
                        ? 'E'
                        : form.shift,

            fat: numeric(form.fat),
            snf: numeric(form.snf),
            clr: numeric(form.clr),
            uria: numeric(form.uria),
            ammonia: numeric(form.ammonia),
            nitrate: numeric(form.nitrate),
            starch: numeric(form.starch),
            sugar: numeric(form.sugar),
            glucose: numeric(form.glucose),
            salt: numeric(form.salt),
            neutral: numeric(form.neutral),
            hydrogen: numeric(form.hydrogen),
            formalin: numeric(form.formalin),
            protein: numeric(form.protein),
            water: numeric(form.water),
            temperature: numeric(form.temperature),
            lacto: numeric(form.lacto),
            mbrt: numeric(form.txtdegree),
            matter: numeric(form.matter),

            createdBy: userId,
            createdDateTime: now,
            modifyBy: userId,
            modifyDateTime: now,
            companyId,
        };

        setSaving(true);
        setIsLoading(true);

        try {
            await saveMorningQuality(apiUrl, flag, payload);

            toast(
                flag === 1
                    ? 'Quality updated successfully.'
                    : 'Quality saved successfully.',
            );

            const wasEditing = flag === 1;

            setShowForm(false);
            setShowPendingForm(!wasEditing);
            setShowTable(wasEditing);
            setForm(initialForm());
            setFlag(0);

            await loadPendingList();

            if (wasEditing) {
                await loadSavedList();
            }
        } catch (error) {
            console.error('Save Quality error:', error);

            toast(
                error instanceof Error
                    ? error.message
                    : 'Unable to save quality.',
            );
        } finally {
            setSaving(false);
            setIsLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteItem) return;

        setIsLoading(true);

        try {
            await deleteMorningQuality(apiUrl, deleteItem.CodeNo);

            toast('Quality deleted successfully.');
            setDeleteItem(null);

            await loadSavedList();
        } catch (error) {
            console.error('Delete Quality error:', error);

            toast(
                error instanceof Error
                    ? error.message
                    : 'Delete failed.',
            );
        } finally {
            setIsLoading(false);
        }
    };

    const tableRows = (rows: QualityRow[], pending: boolean) => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-line text-left">
                        {(pending
                            ? [
                                'Tr No',
                                'Branch',
                                'Route',
                                'Farmer Name',
                                'Milk Type',
                                'Sample No',
                                'Weight Kg',
                                'Weight Liter',
                                'Actions',
                            ]
                            : [
                                'Tr No',
                                'Branch',
                                'Farmer Name',
                                'Shift',
                                'Milk Type',
                                'Fat',
                                'SNF',
                                'Actions',
                            ]
                        ).map((heading) => (
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
                    {isLoading ? (
                        <tr>
                            <td
                                colSpan={pending ? 9 : 8}
                                className="px-4 py-8 text-center"
                            >
                                Loading records...
                            </td>
                        </tr>
                    ) : rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={pending ? 9 : 8}
                                className="px-4 py-8 text-center text-mute"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (
                        rows.map((item, index) => (
                            <tr
                                key={`${item.CodeNo}-${index}`}
                                className="border-b border-line"
                            >
                                <td className="whitespace-nowrap px-4 py-3">
                                    {item.CodeNo}
                                </td>

                                <td className="whitespace-nowrap px-4 py-3">
                                    {pending
                                        ? item.BranchId ?? '-'
                                        : item.BranchName ?? item.BranchId ?? '-'}
                                </td>

                                {pending ? (
                                    <>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {item.RouteId ?? '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {item.AcName ?? '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {milkLabel(item.MilkType)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {item.SampleNo ?? '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {nf(numeric(item.WeightKilo))}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {nf(numeric(item.WeightLiter))}
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {item.AcName ?? '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {shiftLabel(item.Shift)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {milkLabel(item.MilkType)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {nf(numeric(item.Fat))}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {nf(numeric(item.SNF))}
                                        </td>
                                    </>
                                )}

                                <td className="whitespace-nowrap px-4 py-3">
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => void editRecord(item, pending)}
                                        >
                                            <Pencil size={14} />
                                        </Button>

                                        {!pending && (
                                            <Button
                                                variant="outline"
                                                onClick={() => setDeleteItem(item)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

    const pagination = (total: number) => {
        const totalPages = Math.max(1, Math.ceil(total / pageSize));

        return (
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
                        {total === 0
                            ? 0
                            : pageIndex * pageSize + 1}
                        {'–'}
                        {Math.min((pageIndex + 1) * pageSize, total)}
                        {' of '}
                        {total}
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
                        onClick={() => setPageIndex((p) => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>
        );
    };

    const pendingPage = pendingList.slice(
        pageIndex * pageSize,
        (pageIndex + 1) * pageSize,
    );

    const savedPage = qualityList.slice(
        pageIndex * pageSize,
        (pageIndex + 1) * pageSize,
    );

    return (
        <div className="space-y-5">
            {showForm ? (
                <PageHeader
                    title="Morning Quality"
                    subtitle="Manage farmer milk quality, Fat, SNF and Degree."
                    actions={
                        <Button
                            variant="outline"
                            icon={<X size={16} />}
                            onClick={closeForm}
                        >
                            Close Form
                        </Button>
                    }
                />
            ) : (
                <PageHeader
                    title="Morning Quality"
                    subtitle="Manage farmer milk quality, Fat, SNF and Degree."
                    actions={
                        <div className="flex flex-wrap gap-2">
                            {showPendingForm && (
                                <Button
                                    variant="outline"
                                    onClick={() => void openSavedList()}
                                >
                                    Saved Quality List
                                </Button>
                            )}

                            {showTable && (
                                <Button
                                    variant="outline"
                                    onClick={() => void openPendingList()}
                                >
                                    Pending Quality List
                                </Button>
                            )}
                        </div>
                    }
                />
            )}

            {showPendingForm && (
                <>
                    <Card className="p-4">
                        <div className="grid gap-4 md:grid-cols-4">
                            <label className="text-sm">
                                <span className="mb-1 block">From Date</span>
                                <Input
                                    type="date"
                                    value={pendingFrom}
                                    onChange={(e) => setPendingFrom(e.target.value)}
                                />
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block">To Date</span>
                                <Input
                                    type="date"
                                    value={pendingTo}
                                    onChange={(e) => setPendingTo(e.target.value)}
                                />
                            </label>

                            <div className="flex items-end">
                                <Button
                                    icon={<Search size={16} />}
                                    onClick={() => void loadPendingList()}
                                >
                                    Search
                                </Button>
                            </div>

                            {/* <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    icon={<RefreshCw size={16} />}
                                    onClick={() => void loadPendingList()}
                                >
                                    Refresh
                                </Button>
                            </div> */}

                        </div>
                    </Card>

                    <Card>
                        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
                            <h2 className="text-base font-bold">
                                Pending Quality List
                            </h2>

                            <span className="ml-auto text-sm text-mute">
                                {pendingList.length} records
                            </span>
                        </div>

                        {tableRows(pendingPage, true)}
                        {pagination(pendingList.length)}
                    </Card>
                </>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-6 py-4">
                            <div>
                                <h2 className="text-xl font-bold">
                                    {flag === 1
                                        ? 'Edit Quality Information'
                                        : 'Add Quality'}
                                </h2>

                                <p className="mt-1 text-sm text-mute">
                                    {form.shift} quality entry
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                className="rounded-lg p-2 text-mute transition hover:bg-slate-100 hover:text-slate-900"
                                aria-label="Close form"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={submitForm}>
                            <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
                                <label className="text-sm">
                                    <span className="mb-1 block font-bold  text-slate-900">Date</span>
                                    <Input
                                        type="date"
                                        value={form.trDate}
                                        readOnly
                                    />
                                </label>

                                <label className="text-sm">
                                    <span className="mb-1 block font-bold  text-slate-900">
                                        Code No
                                    </span>
                                    <Input
                                        value={String(form.CodeNo || '')}
                                        readOnly
                                    />
                                </label>

                                <label className="text-sm">
                                    <span className="mb-1 block font-bold  text-slate-900">MCC</span>
                                    <Input value={form.mcc} readOnly />
                                </label>

                                <label className="text-sm">
                                    <span className="mb-1 block font-bold  text-slate-900">Route</span>
                                    <Input value={form.route} readOnly />
                                </label>

                                <label className="text-sm">
                                    <span className="mb-1 block font-bold  text-slate-900">Farmer</span>
                                    <Input value={form.farmer} readOnly />
                                </label>

                                <label className="text-sm">
                                    <span className="mb-1 block font-bold  text-slate-900">Shift</span>
                                    <Input value={form.shift} readOnly />
                                </label>

                                <label className="text-sm">
                                    <span className="mb-1 block font-bold  text-slate-900">Milk Type</span>
                                    <Input value={milkLabel(form.milkType)} readOnly />
                                </label>

                                <label className="text-sm">
                                    <span className="mb-1 block font-bold  text-slate-900">Sample No</span>
                                    <Input
                                        type="number"
                                        value={String(form.sampleNo)}
                                        readOnly
                                    />
                                </label>

                                <label className="text-sm">
                                    <span className="mb-1 block font-bold  text-slate-900">Fat *</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={form.fat}
                                        onChange={(e) => updateForm('fat', e.target.value)}
                                        required
                                    />
                                </label>

                                <label className="text-sm">
                                    <span className="mb-1 block font-bold  text-slate-900">SNF *</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={form.snf}
                                        onChange={(e) => updateForm('snf', e.target.value)}
                                        required
                                    />
                                </label>

                                <label className="text-sm">
                                    <span className="mb-1 block font-bold  text-slate-900">Degree *</span>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={form.txtdegree}
                                        onChange={(e) =>
                                            updateForm('txtdegree', e.target.value)
                                        }
                                        required
                                    />
                                </label>

                                <label className="text-sm">
                                    <span className="mb-1 block font-bold  text-slate-900">Water</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={form.water}
                                        onChange={(e) => updateForm('water', e.target.value)}
                                    />
                                </label>
                            </div>

                            <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-line bg-slate-50 px-6 py-4">
                                <Button
                                    disabled={saving}
                                    icon={<Save size={16} />}
                                    onClick={() => { }}
                                >
                                    {saving
                                        ? 'Saving...'
                                        : flag === 1
                                            ? 'Update'
                                            : 'Save'}
                                </Button>

                                <Button
                                    variant="outline"
                                    icon={<RefreshCw size={16} />}
                                    onClick={() => setForm((prev) => ({
                                        ...initialForm(),
                                        trDate: prev.trDate,
                                        CodeNo: prev.CodeNo,
                                        mcc: prev.mcc,
                                        route: prev.route,
                                        farmer: prev.farmer,
                                        mccId: prev.mccId,
                                        routeId: prev.routeId,
                                        supCode: prev.supCode,
                                        sampleNo: prev.sampleNo,
                                        shift: prev.shift,
                                        milkType: prev.milkType,
                                    }))}
                                >
                                    Reset
                                </Button>

                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {showTable && (
                <>
                    <Card className="p-4">
                        <div className="grid gap-4 md:grid-cols-4">
                            <label className="text-sm">
                                <span className="mb-1 block">From Date</span>
                                <Input
                                    type="date"
                                    value={savedFrom}
                                    onChange={(e) => setSavedFrom(e.target.value)}
                                />
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block">To Date</span>
                                <Input
                                    type="date"
                                    value={savedTo}
                                    onChange={(e) => setSavedTo(e.target.value)}
                                />
                            </label>

                            <div className="flex items-end">
                                <Button
                                    icon={<Search size={16} />}
                                    onClick={() => void loadSavedList()}
                                >
                                    Search
                                </Button>
                            </div>

                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    icon={<RefreshCw size={16} />}
                                    onClick={() => void loadSavedList()}
                                >
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
                            <h2 className="text-base font-bold">
                                Saved Quality List
                            </h2>

                            <span className="ml-auto text-sm text-mute">
                                {qualityList.length} records
                            </span>
                        </div>

                        {tableRows(savedPage, false)}
                        {pagination(qualityList.length)}
                    </Card>
                </>
            )}

            {deleteItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <Card className="w-full max-w-md p-5">
                        <h2 className="text-lg font-bold">
                            Confirm Delete
                        </h2>

                        <p className="mt-3 text-sm text-mute">
                            Are you sure you want to delete quality record{' '}
                            {deleteItem.CodeNo}?
                        </p>

                        <div className="mt-5 flex justify-end gap-3">
                            <Button
                                disabled={isLoading}
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
