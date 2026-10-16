import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Save, RefreshCw, X, Pencil, Trash2, Download } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Input, Select } from '../components/ui/Fields';
import { useToast } from '../context/ToastContext';
import { nf, todayISO } from '../lib/format';
import { getMorningWeightList, getMorningWeightAccounts, saveMorningWeight, deleteMorningWeight, } from '../services/morningWeight.service';
import { environment } from '../config/environment';

type Option = {
    id: string;
    name: string;
};

type WeightRecord = {
    id: string;
    CodeNo: number;
    SampleNo: number;
    Date: string;
    MCCId: string;
    RouteId: string;
    FarmerId: string;
    AcName: string;
    Shift: string;
    MilkType: string;
    Arrival: string;
    ViaTank: string;
    CanIn: number;
    AcceptedCan: number;
    SourMilkKilo: number;
    SourMilkLiter: number;
    WeightKilo: number;
    WeightLiter: number;
};

type WeightForm = {
    trDate: string;
    mcc: string;
    route: string;
    farmer: string;
    shift: string;
    milkType: string;
    arrival: string;
    viatank: string;
    txtcanin: string;
    txtacceptedcan: string;
    sourMilkKilo: string;
    sourMilkLiter: string;
    weightKilo: string;
    weightLiter: string;
};

const initialForm = (): WeightForm => ({
    trDate: todayISO(),
    mcc: '',
    route: '',
    farmer: '',
    shift: new Date().getHours() < 12 ? 'M' : 'E',
    milkType: 'C',
    arrival: new Date().toLocaleTimeString('en-IN'),
    viatank: '1',
    txtcanin: '',
    txtacceptedcan: '',
    sourMilkKilo: '',
    sourMilkLiter: '',
    weightKilo: '',
    weightLiter: '',
});

const shiftLabel = (value: string) =>
    value === 'M' || value === 'Morning' ? 'Morning' : 'Evening';


const milkLabel = (value: string) => {
    const milk = value?.toLowerCase();

    if (milk === 'c' || milk === 'cow') return 'Cow';
    if (milk === 'b' || milk === 'buff' || milk === 'buffalo') {
        return 'Buffalo';
    }

    return 'Mix';
};


const dateValue = (value: unknown) => {
    if (!value) return todayISO();
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) return todayISO();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const numeric = (value: unknown) => Number(value) || 0;

const MorningWeight = () => {
    const toast = useToast();

    const [rows, setRows] = useState<WeightRecord[]>([]);
    const [mccOptions, setMccOptions] = useState<Option[]>([]);
    const [routeOptions, setRouteOptions] = useState<Option[]>([]);
    const [farmerOptions, setFarmerOptions] = useState<Option[]>([]);
    const [accountMccData, setAccountMccData] = useState<any[]>([]);

    const [form, setForm] = useState<WeightForm>(initialForm());
    const [fromDate, setFromDate] = useState(todayISO());
    const [toDate, setToDate] = useState(todayISO());
    const [search, setSearch] = useState('');
    const [milkFilter, setMilkFilter] = useState('All');
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editCode, setEditCode] = useState(0);
    const [editSampleNo, setEditSampleNo] = useState(0);
    const [deleteItem, setDeleteItem] = useState<WeightRecord | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 10;


    const branchId = localStorage.getItem('combinedId') || '1001101';
    const firmId = Number(localStorage.getItem('firmId') || 1001);

    const firms = [firmId];
    const branches = [branchId];

    console.log('Stored firmId:', firmId);
    console.log('Stored branchId:', branchId);
    console.log('Available firms:', firms);
    console.log('Selected firm:', firmId);
    console.log('Available branches:', branches);
    console.log('Selected branch:', branchId);

    const userId = Number(localStorage.getItem('userId') || 0);
    const companyId = localStorage.getItem('companyId') || '0';

    const apiUrl = environment.staticIP1;

    const loadList = useCallback(async () => {
        if (!branchId) {
            setRows([]);
            return;
        }

        setLoading(true);

        try {

            console.log('MorningWeight API Request:', { branchId, fromDate, toDate, });

            const list = await getMorningWeightList(apiUrl, branchId, fromDate, toDate);

            console.log('Morning Weight List:', list);
            console.log('Morning Weight Count:', list.length);

            const mappedRows = list.map((item: any, index: number) => {
                const code = numeric(item.CodeNo ?? item.codeNo);

                return {
                    id: String(code || item.SampleNo || item.sampleNo || index),
                    CodeNo: code,
                    SampleNo: numeric(item.SampleNo ?? item.sampleNo),
                    Date: dateValue(
                        item.TrDate ??
                        item.trDate ??
                        item.Date ??
                        item.date
                    ),
                    MCCId: String(item.MCCId ?? item.mccId ?? ''),
                    RouteId: String(item.RouteId ?? item.routeId ?? ''),
                    FarmerId: String(
                        item.SupCode ??
                        item.supCode ??
                        item.FarmerId ??
                        ''
                    ),
                    AcName: String(
                        item.AcName ??
                        item.acName ??
                        item.FarmerName ??
                        ''
                    ),
                    Shift: String(item.Shift ?? item.shift ?? 'M'),
                    MilkType: String(item.MilkType ?? item.milkType ?? 'C'),
                    Arrival: String(item.Arrival ?? item.arrival ?? ''),
                    ViaTank: String(item.ViaTank ?? item.viaTank ?? '1'),
                    CanIn: numeric(item.CanIn ?? item.canIn),
                    AcceptedCan: numeric(item.AcceptedCan ?? item.acceptedCan),
                    SourMilkKilo: numeric(item.SourMilkKilo ?? item.sourMilkKilo),
                    SourMilkLiter: numeric(item.SourMilkLiter ?? item.sourMilkLiter),
                    WeightKilo: numeric(item.WeightKilo ?? item.weightKilo),
                    WeightLiter: numeric(item.WeightLiter ?? item.weightLiter),
                };
            });

            setRows(mappedRows);

        } catch (error) {
            console.error('Morning Weight list error:', error);
            setRows([]);
            toast('Unable to load Morning Weight list.');
        } finally {
            setLoading(false);
        }
    }, [apiUrl, branchId, fromDate, toDate, toast]);



    const loadAccounts = useCallback(async () => {
        try {

            const accounts = await getMorningWeightAccounts(apiUrl);
            const firm = accounts.find(
                (item: any) =>
                    String(item.FirmId ?? item.firmId).trim() === String(firmId).trim());

            if (!firm) {
                console.error('Stored firm not found:', firmId);

                setAccountMccData([]);
                setMccOptions([]);
                setRouteOptions([]);
                setFarmerOptions([]);

                setForm((old) => ({ ...old, mcc: '', route: '', farmer: '', }));

                return;
            }

            const branches: any[] = firm.Branches ?? firm.branches ?? [];


            const branch = branches.find(
                (item: any) =>
                    String(item.BranchId ?? item.branchId).trim() ===
                    String(branchId).trim()
            );

            if (!branch) {
                console.error('Stored branch not found:', branchId);

                setAccountMccData([]);
                setMccOptions([]);
                setRouteOptions([]);
                setFarmerOptions([]);

                setForm((old) => ({
                    ...old,
                    mcc: '',
                    route: '',
                    farmer: '',
                }));

                return;
            }


            const mccs: any[] = branch.MCC ?? branch.mcc ?? [];

            setAccountMccData(mccs);

            const mappedMccs: Option[] = mccs.map((item: any) => ({
                id: String(item.MCCId ?? item.mccId ?? ''),
                name: String(item.MCCName ?? item.mccName ?? ''),
            }));

            setMccOptions(mappedMccs);

            const firstMcc = mccs[0];
            const routes: any[] = firstMcc?.Routes ?? firstMcc?.routes ?? [];

            const mappedRoutes: Option[] = routes.map((item: any) => ({
                id: String(item.RouteId ?? item.routeId ?? ''),
                name: String(item.RouteName ?? item.routeName ?? ''),
            }));

            setRouteOptions(mappedRoutes);

            const firstRoute = routes[0];
            const farmers: any[] =
                firstRoute?.Accounts ?? firstRoute?.accounts ?? [];

            const mappedFarmers: Option[] = farmers.map((item: any) => ({
                id: String(item.AcCode ?? item.acCode ?? ''),
                name: String(item.AcName ?? item.acName ?? ''),
            }));

            setFarmerOptions(mappedFarmers);

            setForm((old) => ({
                ...old,
                mcc: mappedMccs[0]?.id ?? '',
                route: mappedRoutes[0]?.id ?? '',
                farmer: mappedFarmers[0]?.id ?? '',
            }));

        } catch (error) {
            console.error('Account dropdown error:', error);

            setAccountMccData([]);
            setMccOptions([]);
            setRouteOptions([]);
            setFarmerOptions([]);

            setForm((old) => ({
                ...old,
                mcc: '',
                route: '',
                farmer: '',
            }));

            toast('Unable to load MCC, Route and Farmer data.');
        }
    }, [apiUrl, branchId, firmId, toast]);





    useEffect(() => {
        void loadList();
    }, [loadList]);

    useEffect(() => {
        void loadAccounts();
    }, [loadAccounts]);


    const onMccChange = (mccId: string) => {
        const selectedMcc = accountMccData.find(
            (item: any) =>
                String(item.MCCId ?? item.mccId) === mccId,
        );

        const routes = selectedMcc?.Routes ?? selectedMcc?.routes ?? [];
        const firstRoute = routes[0];
        const farmers = firstRoute?.Accounts ?? firstRoute?.accounts ?? [];

        setRouteOptions(
            routes.map((item: any) => ({
                id: String(item.RouteId ?? item.routeId),
                name: String(item.RouteName ?? item.routeName ?? ''),
            })),
        );

        setFarmerOptions(
            farmers.map((item: any) => ({
                id: String(item.AcCode ?? item.acCode),
                name: String(item.AcName ?? item.acName ?? ''),
            })),
        );

        setForm((old) => ({
            ...old,
            mcc: mccId,
            route: String(firstRoute?.RouteId ?? firstRoute?.routeId ?? ''),
            farmer: String(farmers[0]?.AcCode ?? farmers[0]?.acCode ?? ''),
        }));
    };



    const onRouteChange = (routeId: string) => {
        const selectedMcc = accountMccData.find(
            (item: any) =>
                String(item.MCCId ?? item.mccId) === form.mcc,
        );

        const routes = selectedMcc?.Routes ?? selectedMcc?.routes ?? [];

        const selectedRoute = routes.find(
            (item: any) =>
                String(item.RouteId ?? item.routeId) === routeId,
        );

        const farmers = selectedRoute?.Accounts ?? selectedRoute?.accounts ?? [];

        setFarmerOptions(
            farmers.map((item: any) => ({
                id: String(item.AcCode ?? item.acCode),
                name: String(item.AcName ?? item.acName ?? ''),
            })),
        );

        setForm((old) => ({
            ...old,
            route: routeId,
            farmer: String(farmers[0]?.AcCode ?? farmers[0]?.acCode ?? ''),
        }));
    };


    const changeField = (key: keyof WeightForm, value: string) => {
        setForm((old) => {
            const next = { ...old, [key]: value };

            if (key === 'weightKilo') {
                next.weightLiter = value
                    ? (numeric(value) * 0.9707).toFixed(2)
                    : '';
            }

            if (key === 'sourMilkKilo') {
                next.sourMilkLiter = value
                    ? (numeric(value) * 0.9707).toFixed(2)
                    : '';
            }

            return next;
        });
    };

    const openNew = () => {
        setEditCode(0);
        setEditSampleNo(0);
        setForm({
            ...initialForm(),
            mcc: mccOptions[0]?.id ?? '',
            route: routeOptions[0]?.id ?? '',
            farmer: farmerOptions[0]?.id ?? '',
        });
        setShowForm(true);
    };

    const editRow = async (item: WeightRecord) => {
        setEditCode(item.CodeNo);
        setEditSampleNo(item.SampleNo);
        setForm({
            trDate: item.Date,
            mcc: item.MCCId,
            route: item.RouteId,
            farmer: item.FarmerId,
            shift: item.Shift === 'Morning' ? 'M' : item.Shift === 'Evening' ? 'E' : item.Shift,
            milkType: item.MilkType,
            arrival: item.Arrival,
            viatank: item.ViaTank,
            txtcanin: String(item.CanIn),
            txtacceptedcan: String(item.AcceptedCan),
            sourMilkKilo: String(item.SourMilkKilo),
            sourMilkLiter: String(item.SourMilkLiter),
            weightKilo: String(item.WeightKilo),
            weightLiter: String(item.WeightLiter),
        });

        setShowForm(true);
    };

    const save = async () => {
        if (!form.mcc || !form.route || !form.farmer || numeric(form.weightKilo) <= 0) {
            toast('Please select MCC, Route, Farmer and enter valid Weight Kg.');
            return;
        }

        setSaving(true);

        try {
            const payload = {
                codeNo: editCode || 0,
                branchId: Number(branchId),
                mccId: Number(form.mcc),
                routeId: Number(form.route),
                trDate: form.trDate,
                supCode: Number(form.farmer),
                sampleNo: editCode ? editSampleNo : 0,
                weightKilo: numeric(form.weightKilo),
                weightLiter: numeric(form.weightLiter),
                sourMilkKilo: numeric(form.sourMilkKilo),
                sourMilkLiter: numeric(form.sourMilkLiter),
                shift: form.shift,
                milkType: form.milkType,
                arrival: form.arrival,
                viaTank: form.viatank,
                canIn: numeric(form.txtcanin),
                acceptedCan: numeric(form.txtacceptedcan),
                createdBy: userId,
                createdDateTime: new Date().toISOString(),
                modifyBy: userId,
                modifyDateTime: new Date().toISOString(),
                companyId,
            };

            await saveMorningWeight(apiUrl, payload, editCode);

            toast(editCode ? 'Morning Weight updated successfully.' : 'Morning Weight saved successfully.');
            setShowForm(false);
            setForm(initialForm());
            setEditCode(0);
            await loadList();
        } catch (error) {
            console.error('Save error:', error);
            toast(error instanceof Error ? error.message : 'Unable to save Morning Weight.');
        } finally {
            setSaving(false);
        }
    };

    const deleteRow = async () => {
        if (!deleteItem) return;

        try {
            await deleteMorningWeight(apiUrl, deleteItem.CodeNo);

            toast('Morning Weight deleted successfully.');
            setDeleteItem(null);
            await loadList();

        } catch (error) {
            console.error('Delete error:', error);
            toast(error instanceof Error ? error.message : 'Delete failed.');
        }
    };

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();

        return rows.filter((item) => {
            const matchesMilk =
                milkFilter === 'All' || item.MilkType === milkFilter;

            const matchesSearch =
                !query ||
                [
                    item.CodeNo,
                    item.AcName,
                    item.FarmerId,
                    item.MCCId,
                    item.RouteId,
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(query);

            return matchesMilk && matchesSearch;
        });
    }, [rows, search, milkFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
    const totalKg = filteredRows.reduce((sum, item) => sum + item.WeightKilo, 0);
    const totalLiter = filteredRows.reduce((sum, item) => sum + item.WeightLiter, 0);
    const totalCan = filteredRows.reduce((sum, item) => sum + item.CanIn, 0);

    return (
        <div className="space-y-5">
            <PageHeader
                title="Morning Weight"
                subtitle="Manage farmer milk collection, can entry and milk weight."
                actions={
                    <div className="flex gap-2">
                        {!showForm && (
                            <Button
                                variant="outline"
                                icon={<Download size={16} />}
                                onClick={() => {
                                    const csv = [
                                        ['Tr No', 'Date', 'Farmer', 'Shift', 'Milk Type', 'Can In', 'Weight Kg', 'Weight Liter'],
                                        ...filteredRows.map((r) => [
                                            r.CodeNo, r.Date, r.AcName, shiftLabel(r.Shift),
                                            milkLabel(r.MilkType), r.CanIn, r.WeightKilo, r.WeightLiter,
                                        ]),
                                    ]
                                        .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
                                        .join('\n');

                                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                    const link = document.createElement('a');
                                    link.href = URL.createObjectURL(blob);
                                    link.download = 'morning-weight.csv';
                                    link.click();
                                    URL.revokeObjectURL(link.href);
                                }}
                            >
                                Export CSV
                            </Button>
                        )}

                        <Button
                            icon={showForm ? <X size={16} /> : <Plus size={16} />}
                            onClick={() => showForm ? setShowForm(false) : openNew()}
                        >
                            {showForm ? 'Close Form' : 'Add Weight'}
                        </Button>
                    </div>
                }
            />

            {!showForm ? (
                <>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {[
                            { label: 'Total Records', value: String(filteredRows.length) },
                            { label: 'Total Cans', value: nf(totalCan) },
                            { label: 'Weight (Kg)', value: nf(totalKg) },
                            { label: 'Weight (Liter)', value: nf(totalLiter) },
                        ].map((stat) => (
                            <Card key={stat.label} className="p-4 sm:p-5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-mute">
                                    {stat.label}
                                </p>
                                <p className="mt-1 text-2xl font-extrabold tnum">
                                    {stat.value}
                                </p>
                            </Card>
                        ))}
                    </div>

                    <Card className="p-4">
                        <div className="grid gap-4 md:grid-cols-4">
                            <label className="text-sm">
                                <span className="mb-1 block">From Date</span>
                                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block">To Date</span>
                                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                            </label>

                            <div className="flex items-end">
                                <Button icon={<Search size={16} />} onClick={() => void loadList()}>
                                    Search
                                </Button>
                            </div>

                            <div className="flex items-end">
                                <Button variant="outline" icon={<RefreshCw size={16} />} onClick={() => void loadList()}>
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
                            <div className="min-w-[200px] flex-1 sm:max-w-sm">
                                <Input
                                    icon={<Search size={16} />}
                                    placeholder="Search farmer, MCC, route..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>

                            <div className="w-44">
                                <Select
                                    aria-label="Milk Type"
                                    value={milkFilter}
                                    onChange={(e) => {
                                        setMilkFilter(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <option value="All">Milk Type: All</option>
                                    <option value="C">Cow</option>
                                    <option value="B">Buffalo</option>
                                    <option value="M">Mix</option>
                                </Select>
                            </div>

                            <span className="ml-auto text-sm text-mute">
                                {filteredRows.length} records
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-line text-left">
                                        {['Tr No', 'Date', 'Farmer Name', 'Shift', 'Milk Type', 'Can In', 'Weight Kg', 'Weight Liter', 'Actions'].map((heading) => (
                                            <th key={heading} className="whitespace-nowrap px-4 py-3 font-semibold">
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={9} className="px-4 py-8 text-center">Loading records...</td></tr>
                                    ) : pageRows.length === 0 ? (
                                        <tr><td colSpan={9} className="px-4 py-8 text-center text-mute">No records found</td></tr>
                                    ) : (
                                        pageRows.map((item) => (
                                            <tr key={item.id} className="border-b border-line">
                                                <td className="px-4 py-3">{item.CodeNo}</td>
                                                <td className="px-4 py-3">{item.Date}</td>
                                                <td className="px-4 py-3">{item.AcName || item.FarmerId}</td>
                                                <td className="px-4 py-3">{shiftLabel(item.Shift).charAt(0)}</td>
                                                <td className="px-4 py-3">{milkLabel(item.MilkType)}</td>
                                                <td className="px-4 py-3">{nf(item.CanIn)}</td>
                                                <td className="px-4 py-3">{nf(item.WeightKilo)}</td>
                                                <td className="px-4 py-3">{nf(item.WeightLiter)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" onClick={() => void editRow(item)}>
                                                            <Pencil size={14} />
                                                        </Button>
                                                        <Button variant="outline" onClick={() => setDeleteItem(item)}>
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

                        <div className="flex items-center justify-between border-t border-line p-4">
                            <span className="text-sm text-mute">
                                Page {page} of {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                                    Previous
                                </Button>
                                <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                                    Next
                                </Button>
                            </div>
                        </div>
                    </Card>
                </>
                // ) : (
                //     <Card className="p-5">
                //         <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
                //             <h2 className="text-lg font-bold">
                //                 {editCode ? 'Edit Weight Information' : 'Weight Information'}
                //             </h2>
                //             <Button variant="outline" onClick={() => setShowForm(false)}>
                //                 <X size={16} />
                //             </Button>
                //         </div>





            ) : (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl">

                        {/* Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-6 py-4">
                            <div>
                                <h2 className="text-xl font-bold">
                                    {editCode ? 'Edit Weight Information' : 'Add Weight'}
                                </h2>
                                {/* <p className="mt-1 text-sm text-mute">
                                    Fill the details and save
                                </p> */}
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="rounded-lg p-2 hover:bg-slate-100"
                                aria-label="Close form"
                            >
                                <X size={20} />
                            </button>
                        </div>



                        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center"> */}
                        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center px-6 py-6">
                            <label className="text-sm">
                                <span className="mb-1 block font-bold  text-slate-900">Date</span>
                                <Input type="date" value={form.trDate} onChange={(e) => changeField('trDate', e.target.value)} />
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block font-bold  text-slate-900">MCC *</span>
                                <Select value={form.mcc} onChange={(e) => onMccChange(e.target.value)}>
                                    <option value="">Select MCC</option>
                                    {mccOptions.map((item) => (
                                        <option key={item.id} value={item.id}>{item.id} | {item.name}</option>
                                    ))}
                                </Select>
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block font-bold  text-slate-900">Route *</span>
                                <Select value={form.route} onChange={(e) => onRouteChange(e.target.value)}>
                                    <option value="">Select Route</option>
                                    {routeOptions.map((item) => (
                                        <option key={item.id} value={item.id}>{item.id} | {item.name}</option>
                                    ))}
                                </Select>
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block font-bold  text-slate-900">Farmer *</span>
                                <Select value={form.farmer} onChange={(e) => changeField('farmer', e.target.value)}>
                                    <option value="">Select Farmer</option>
                                    {farmerOptions.map((item) => (
                                        <option key={item.id} value={item.id}>{item.id} | {item.name}</option>
                                    ))}
                                </Select>
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block font-bold  text-slate-900">Shift *</span>
                                <Select value={form.shift} onChange={(e) => changeField('shift', e.target.value)}>
                                    <option value="M">Morning</option>
                                    <option value="E">Evening</option>
                                </Select>
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block font-bold  text-slate-900">Milk Type *</span>
                                <Select value={form.milkType} onChange={(e) => changeField('milkType', e.target.value)}>
                                    <option value="C">Cow</option>
                                    <option value="B">Buffalo</option>
                                    <option value="M">Mix</option>
                                </Select>
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block font-bold  text-slate-900">Arrival</span>
                                <Input value={form.arrival} readOnly />
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block font-bold  text-slate-900">Via Tank *</span>
                                <Select value={form.viatank} onChange={(e) => changeField('viatank', e.target.value)}>
                                    <option value="1">Tank 1</option>
                                    <option value="2">Tank 2</option>
                                    <option value="3">Tank 3</option>
                                </Select>
                            </label>

             
<div className="space-y-4">

  
    <div className="grid grid-cols-2 gap-3">
 
        <label className="text-sm">
            <span className="mb-1 block font-bold text-slate-900">
                Can In *
            </span>
            <input
                type="number"
                min="0"
                value={form.txtcanin}
                onChange={(e) => changeField('txtcanin', e.target.value)}
                className="h-[70px] w-full rounded-[20px] border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-400"
            />
        </label>

  
        <label className="text-sm">
            <span className="mb-1 block font-bold text-slate-900">
                Accepted Can *
            </span>
            <input
                type="number"
                min="0"
                value={form.txtacceptedcan}
                onChange={(e) => changeField('txtacceptedcan', e.target.value)}
                className="h-[70px] w-full rounded-[20px] border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-400"
            />
        </label>
    </div>


    <div className="grid grid-cols-4 gap-3">
      
        <label className="text-sm">
            <span className="mb-1 block font-bold text-slate-900">
                Sour Milk Kg
            </span>
            <input
                type="number"
                min="0"
                step="0.01"
                value={form.sourMilkKilo}
                onChange={(e) => changeField('sourMilkKilo', e.target.value)}
                className="h-[70px] w-full rounded-[20px] border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-400"
            />
        </label>

        <label className="text-sm">
            <span className="mb-1 block font-bold text-slate-900">
                Sour Milk Liter
            </span>
            <input
                value={form.sourMilkLiter}
                readOnly
                className="h-[70px] w-full rounded-[20px] border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-400"
            />
        </label>

     
        <label className="text-sm">
            <span className="mb-1 block font-bold text-slate-900">
                Weight Kg *
            </span>
            <input
                type="number"
                min="0"
                step="0.01"
                value={form.weightKilo}
                onChange={(e) => changeField('weightKilo', e.target.value)}
                className="h-[70px] w-full rounded-[20px] border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-400"
            />
        </label>

       
        <label className="text-sm">
            <span className="mb-1 block font-bold text-slate-900">
                Weight Liter *
            </span>
            <input
                value={form.weightLiter}
                readOnly
                className="h-[70px] w-full rounded-[20px] border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-400"
            />
        </label>
    </div>

</div>




                        </div> */}




                        <div className="grid grid-cols-12 gap-x-4 gap-y-5 items-start px-6 py-6">


                            <label className="col-span-3 min-w-0 text-sm">
                                <span className="mb-1.5 block font-bold text-slate-900">Date</span>
                                <Input
                                    type="date"
                                    value={form.trDate}
                                    onChange={(e) => changeField('trDate', e.target.value)}
                                />
                            </label>

                            {/* MCC */}
                            <label className="col-span-3 min-w-0 text-sm">
                                <span className="mb-1.5 block font-bold text-slate-900">MCC *</span>
                                <Select value={form.mcc} onChange={(e) => onMccChange(e.target.value)}>
                                    <option value="">Select MCC</option>
                                    {mccOptions.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.id} | {item.name}
                                        </option>
                                    ))}
                                </Select>
                            </label>

                            {/* Route */}
                            <label className="col-span-3 min-w-0 text-sm">
                                <span className="mb-1.5 block font-bold text-slate-900">Route *</span>
                                <Select value={form.route} onChange={(e) => onRouteChange(e.target.value)}>
                                    <option value="">Select Route</option>
                                    {routeOptions.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.id} | {item.name}
                                        </option>
                                    ))}
                                </Select>
                            </label>

                            {/* Farmer */}
                            <label className="col-span-3 min-w-0 text-sm">
                                <span className="mb-1.5 block font-bold text-slate-900">Farmer *</span>
                                <Select value={form.farmer} onChange={(e) => changeField('farmer', e.target.value)}>
                                    <option value="">Select Farmer</option>
                                    {farmerOptions.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.id} | {item.name}
                                        </option>
                                    ))}
                                </Select>
                            </label>




                            <div className="col-span-12 grid grid-cols-12 gap-x-4 gap-y-4">

                                <label className="col-span-3 min-w-0 text-sm">
                                    <span className="mb-1.5 block font-bold text-slate-900">Shift *</span>
                                    <Select value={form.shift} onChange={(e) => changeField('shift', e.target.value)}>
                                        <option value="M">Morning</option>
                                        <option value="E">Evening</option>
                                    </Select>
                                </label>



                                {/* Milk Type */}
                                <label className="col-span-3 min-w-0 text-sm">
                                    <span className="mb-1 block font-bold text-slate-900">Milk Type *</span>
                                    <Select value={form.milkType} onChange={(e) => changeField('milkType', e.target.value)}>
                                        <option value="C">Cow</option>
                                        <option value="B">Buffalo</option>
                                        <option value="M">Mix</option>
                                    </Select>
                                </label>

                                {/* Arrival */}
                                <label className="col-span-3 min-w-0 text-sm">
                                    <span className="mb-1 block font-bold text-slate-900">Arrival</span>
                                    <Input value={form.arrival} readOnly />
                                </label>

                                {/* Via Tank */}
                                <label className="col-span-3 min-w-0 text-sm">
                                    <span className="mb-1 block font-bold text-slate-900">Via Tank *</span>
                                    <Select value={form.viatank} onChange={(e) => changeField('viatank', e.target.value)}>
                                        <option value="1">Tank 1</option>
                                        <option value="2">Tank 2</option>
                                        <option value="3">Tank 3</option>
                                    </Select>
                                </label>



                            </div>



                            <label className="col-span-3 min-w-0 text-sm">
                                <span className="mb-1 block font-bold text-slate-900">Can In *</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.txtcanin}
                                    onChange={(e) => changeField('txtcanin', e.target.value)}
                                    className="h-[70px] w-full rounded-[20px] border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-400"
                                />
                            </label>

                            {/* Accepted Can */}
                            <label className="col-span-3 min-w-0 text-sm">
                                <span className="mb-1 block font-bold text-slate-900">Accepted Can *</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.txtacceptedcan}
                                    onChange={(e) => changeField('txtacceptedcan', e.target.value)}
                                    className="h-[70px] w-full rounded-[20px] border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-400"
                                />
                            </label>



                            {/* Sour Milk Kg */}
                            <label className="col-span-3 min-w-0 text-sm">
                                <span className="mb-1 block font-bold text-slate-900">Sour Milk Kg</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.sourMilkKilo}
                                    onChange={(e) => changeField('sourMilkKilo', e.target.value)}
                                    className="h-[70px] w-full rounded-[20px] border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-400"
                                />
                            </label>

                            {/* Sour Milk Liter */}
                            <label className="col-span-3 min-w-0 text-sm">
                                <span className="mb-1 block font-bold text-slate-900">Sour Milk Liter</span>
                                <input
                                    value={form.sourMilkLiter}
                                    readOnly
                                    className="h-[70px] w-full rounded-[20px] border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-400"
                                />
                            </label>

                            {/* Weight Kg */}
                            <label className="col-span-3 min-w-0 text-sm">
                                <span className="mb-1 block font-bold text-slate-900">Weight Kg *</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.weightKilo}
                                    onChange={(e) => changeField('weightKilo', e.target.value)}
                                    className="h-[70px] w-full rounded-[20px] border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-400"
                                />
                            </label>

                            {/* Weight Liter */}
                            <label className="col-span-3 min-w-0 text-sm">
                                <span className="mb-1 block font-bold text-slate-900">Weight Liter *</span>
                                <input
                                    value={form.weightLiter}
                                    readOnly
                                    className="h-[70px] w-full rounded-[20px] border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-400"
                                />
                            </label>

                        </div>






                        <div className="flex flex-wrap justify-end gap-3 border-t border-line bg-slate-50 px-6 py-4">

                            <Button
                                disabled={saving}
                                icon={<Save size={16} />}
                                onClick={() => void save()}
                            >
                                {saving ? 'Saving...' : editCode ? 'Update' : 'Save'}
                            </Button>

                            <Button
                                variant="outline"
                                icon={<RefreshCw size={16} />}
                                onClick={() => {
                                    setForm(initialForm());
                                    setEditCode(0);
                                    setEditSampleNo(0);
                                }}
                            >
                                Reset
                            </Button>


                        </div>
                    </Card>
                </div>
            )}


            {deleteItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <Card className="w-full max-w-md p-5">
                        <h2 className="text-lg font-bold">Confirm Delete</h2>
                        <p className="mt-3 text-sm text-mute">
                            Are you sure you want to delete transaction {deleteItem.CodeNo}?
                        </p>
                        <div className="mt-5 flex justify-end gap-3">
                            <Button onClick={() => void deleteRow()}>
                                Delete
                            </Button>
                            <Button variant="outline" onClick={() => setDeleteItem(null)}>
                                Cancel
                            </Button>

                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default MorningWeight;