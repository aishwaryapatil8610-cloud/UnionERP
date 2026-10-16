
import { useCallback, useEffect, useMemo, useState } from 'react';
import { farmerCollectionService } from '../services/farmer-collection.service';
import { useToast } from '../context/ToastContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Search, RefreshCw, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Input, Select } from '../components/ui/Fields';
import { nf } from '../lib/format';

type AnyRecord = Record<string, any>;

type ReportColumn = {
    column: string;
    visible: boolean;
    order: number;
};

type FilterState = {
    branchId: string;
    routeId: string;
    farmerId: string;
    milkType: string;
    shift: string;
    fromDate: string;
    toDate: string;
};

const today = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const initialFilters: FilterState = {
    branchId: 'All',
    routeId: 'All',
    farmerId: 'All',
    milkType: 'z',
    shift: 'z',
    fromDate: today(),
    toDate: today(),
};

const columnMap: Record<
    string,
    { header: string; cell: (item: AnyRecord) => any }
> = {
    BranchId: { header: 'Branch Id', cell: x => x.BranchId },
    TrDate: {
        header: 'Date',
        cell: x => x.TrDate
            ? new Date(x.TrDate).toLocaleDateString('en-GB')
            : '',
    },
    SupCode: { header: 'Farmer Id', cell: x => x.SupCode },
    Name: { header: 'Farmer Name', cell: x => x.Name },
    SampleNo: { header: 'Sample No', cell: x => x.SampleNo },
    MilkType: {
        header: 'Milk Type',
        cell: x =>
            x.MilkType === 'C' ? 'Cow'
                : x.MilkType === 'B' ? 'Buffalo'
                    : x.MilkType === 'Z' ? 'Both'
                        : x.MilkType === 'M' ? 'Mix'
                            : x.MilkType,
    },
    Shift: {
        header: 'Shift',
        cell: x =>
            x.Shift === 'M' ? 'Morning'
                : x.Shift === 'E' ? 'Evening'
                    : x.Shift,
    },
    WeightKilo: { header: 'Kg', cell: x => x.WeightKilo },
    WeightLiter: { header: 'Liter', cell: x => x.WeightLiter },
    SourMilkCan: { header: 'Sour Milk Can', cell: x => x.SourMilkCan },
    SourMilk: { header: 'Sour Milk', cell: x => x.SourMilk },
    MixCan: { header: 'Mix Can', cell: x => x.MixCan },
    MixMilk: { header: 'Mix Milk', cell: x => x.MixMilk },
    Fat: { header: 'Fat', cell: x => x.Fat },
    KgFat: { header: 'Kg Fat', cell: x => x.KgFat },
    SNF: { header: 'SNF', cell: x => x.SNF },
    KgSNF: { header: 'Kg SNF', cell: x => x.KgSNF },
    Protein: { header: 'Protein', cell: x => x.Protein },
    KgProtein: { header: 'Kg Protein', cell: x => x.KgProtein },
    Digri: { header: 'Digri', cell: x => x.Digri },
    KgDigri: { header: 'Kg Digri', cell: x => x.KgDigri },
    Acidity: { header: 'Acidity', cell: x => x.Acidity },
    Temperature: { header: 'Temperature', cell: x => x.Temperature },
    MBRT: { header: 'MBRT', cell: x => x.MBRT },
    Matter: { header: 'Matter', cell: x => x.Matter },
    Rate: { header: 'Rate', cell: x => x.Rate },
    KgFatRate: { header: 'Kg Fat Rate', cell: x => x.KgFatRate },
    KgSNFRate: { header: 'Kg SNF Rate', cell: x => x.KgSNFRate },
    KgFatAmt: { header: 'Kg Fat Amount', cell: x => x.KgFatAmt },
    KgSNFAmt: { header: 'Kg SNF Amount', cell: x => x.KgSNFAmt },
    TotalAmt: { header: 'Amount', cell: x => x.TotalAmt },
};

function getArray(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.Data)) return data.Data;
    if (Array.isArray(data?.Table)) return data.Table;
    if (Array.isArray(data?.Table1)) return data.Table1;
    return [];
}

function uniqueBy<T extends AnyRecord>(items: T[], key: string): T[] {
    return items.filter(
        (item, index, list) =>
            index === list.findIndex(x => x[key] === item[key]),
    );
}

export default function FarmerCollection() {
    const toast = useToast();

    const [filters, setFilters] = useState<FilterState>(initialFilters);
    const [branches, setBranches] = useState<AnyRecord[]>([]);
    const [routeList, setRouteList] = useState<AnyRecord[]>([]);
    const [farmerList, setFarmerList] = useState<AnyRecord[]>([]);
    const [collectionList, setCollectionList] = useState<AnyRecord[]>([]);
    const [reportConfig, setReportConfig] = useState<ReportColumn[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(100);

    const notify = useCallback(
        (message: string, tone: 'success' | 'error' | 'warning' | 'info' = 'info') => {
            toast(message);
        },
        [toast],
    );

    const updateFilter = (key: keyof FilterState, value: string) => {
        setFilters(previous => ({ ...previous, [key]: value }));
    };

    const getRoutesForBranches = useCallback((selectedBranches: AnyRecord[]) => {
        const routes: AnyRecord[] = [];

        selectedBranches.forEach(branch => {
            (branch.MCC || []).forEach((mcc: AnyRecord) => {
                routes.push(...(mcc.Routes || []));
            });
        });

        return uniqueBy(routes, 'RouteId');
    }, []);

    const applyRoute = useCallback((routeId: string, routes: AnyRecord[]) => {
        if (routeId === 'All') {
            const farmers = routes.flatMap(route => route.Accounts || []);
            setFarmerList(uniqueBy(farmers, 'AcCode'));
            setFilters(previous => ({ ...previous, routeId, farmerId: 'All' }));
            return;
        }

        const selected = routes.find(route => String(route.RouteId) === routeId);
        setFarmerList(selected?.Accounts || []);
        setFilters(previous => ({ ...previous, routeId, farmerId: 'All' }));
    }, []);

    const loadBranches = useCallback(async () => {
        try {
            const response = await farmerCollectionService.getBranchList('F');
            const firms = getArray(response);

            const allBranches = firms.flatMap(firm => firm.Branches || []);
            setBranches(allBranches);

            if (!allBranches.length) {
                setRouteList([]);
                setFarmerList([]);
                return;
            }

            const routes = getRoutesForBranches(allBranches);
            setRouteList(routes);
            setFarmerList(uniqueBy(
                routes.flatMap(route => route.Accounts || []),
                'AcCode',
            ));

            setFilters(previous => ({
                ...previous,
                branchId: 'All',
                routeId: 'All',
                farmerId: 'All',
            }));

            const firstBranchId = String(allBranches[0].BranchId);
            const config = await farmerCollectionService.getReportAccess(
                firstBranchId,
                1,
            );

            setReportConfig(getArray(config).map((item: AnyRecord) => ({
                column: item.column ?? item.Column,
                visible: item.visible ?? item.Visible,
                order: Number(item.order ?? item.Order ?? 0),
            })));
        } catch (error) {
            console.error('Branch / Report Configuration API Error:', error);
            notify('Failed to load branches or report configuration', 'error');
        }
    }, [getRoutesForBranches, notify]);

    useEffect(() => {
        void loadBranches();
    }, [loadBranches]);

    const orderedColumns = useMemo(() => {
        return reportConfig
            .filter(col => col.visible === true && columnMap[col.column])
            .sort((a, b) => a.order - b.order);
    }, [reportConfig]);

    const changeBranch = async (branchId: string) => {
        const selectedBranches = branchId === 'All'
            ? branches
            : branches.filter(branch => String(branch.BranchId) === branchId);

        const routes = getRoutesForBranches(selectedBranches);
        setRouteList(routes);
        setFarmerList(uniqueBy(
            routes.flatMap(route => route.Accounts || []),
            'AcCode',
        ));
        setFilters(previous => ({
            ...previous,
            branchId,
            routeId: 'All',
            farmerId: 'All',
        }));

        const reportBranchId = branchId === 'All'
            ? branches[0]?.BranchId
            : branchId;

        if (reportBranchId) {
            try {
                const config = await farmerCollectionService.getReportAccess(
                    String(reportBranchId),
                    1,
                );
                setReportConfig(getArray(config).map((item: AnyRecord) => ({
                    column: item.column ?? item.Column,
                    visible: item.visible ?? item.Visible,
                    order: Number(item.order ?? item.Order ?? 0),
                })));
            } catch (error) {
                console.error('Report Configuration API Error:', error);
                notify('Failed to load report columns', 'error');
            }
        }
    };

    const loadList = async () => {
        if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
            notify('From Date cannot be greater than To Date', 'warning');
            return;
        }

        setLoading(true);
        setCollectionList([]);
        setPageIndex(0);

        try {
            const branchId = filters.branchId === 'All'
                ? branches.map(item => item.BranchId).join(',')
                : filters.branchId;

            const routeId = filters.routeId === 'All'
                ? routeList.map(item => item.RouteId).join(',')
                : filters.routeId;

            const farmerId = filters.farmerId === 'All'
                ? farmerList.map(item => item.AcCode).join(',')
                : filters.farmerId;

            const response = await farmerCollectionService.getFarmerCollectionList(
                branchId,
                routeId,
                farmerId,
                filters.milkType,
                filters.shift,
                filters.fromDate,
                filters.toDate,
            );

            const data = getArray(response);
            setCollectionList(data);
        } catch (error) {
            console.error('Farmer Collection API Error:', error);
            notify(
                error instanceof Error ? error.message : 'Failed to load Farmer Collection',
                'error',
            );
        } finally {
            setLoading(false);
        }
    };

    const totals = useMemo(() => {
        const liter = collectionList.reduce(
            (sum, item) => sum + Number(item.WeightKilo || 0),
            0,
        );

        const fatKg = collectionList.reduce(
            (sum, item) => sum + 1.03 * Number(item.WeightKilo || 0) * Number(item.Fat || 0),
            0,
        );

        const snfKg = collectionList.reduce(
            (sum, item) => sum + 1.03 * Number(item.WeightKilo || 0) * Number(item.SNF || 0),
            0,
        );

        return {
            liter: Number(liter.toFixed(2)),
            fat: liter > 0 ? Number((fatKg / (1.03 * liter)).toFixed(2)) : 0,
            snf: liter > 0 ? Number((snfKg / (1.03 * liter)).toFixed(2)) : 0,
            farmers: new Set(collectionList.map(item => item.SupCode)).size,
        };
    }, [collectionList]);

    const pageCount = Math.ceil(collectionList.length / pageSize);

    const paginatedList = useMemo(() => {
        const start = pageIndex * pageSize;
        return collectionList.slice(start, start + pageSize);
    }, [collectionList, pageIndex, pageSize]);

    const getExportRows = () => collectionList.map(item => {
        const row: AnyRecord = {};
        orderedColumns.forEach(col => {
            const definition = columnMap[col.column];
            if (definition) row[definition.header] = definition.cell(item) ?? '';
        });
        return row;
    });

    const exportExcel = () => {
        if (!collectionList.length) {
            notify('No data available to export', 'warning');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(getExportRows());
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Farmer Collection');
        XLSX.writeFile(workbook, 'Farmer_Collection.xlsx');
    };

    const exportPDF = () => {
        if (!collectionList.length) {
            notify('No data available to export', 'warning');
            return;
        }

        if (!orderedColumns.length) {
            notify('No columns available for export', 'warning');
            return;
        }

        const doc = new jsPDF('l', 'mm', 'a4');
        const headers = [
            orderedColumns.map(col => columnMap[col.column]?.header || ''),
        ];
        const rows = collectionList.map(item =>
            orderedColumns.map(col => columnMap[col.column]?.cell(item) ?? ''),
        );

        doc.setFontSize(14);
        doc.text('Farmer Collection', 14, 12);

        autoTable(doc, {
            head: headers,
            body: rows,
            startY: 18,
            styles: {
                fontSize: 6.5,
                cellPadding: 2,
                overflow: 'linebreak',
                valign: 'middle',
                halign: 'center',
            },
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: [255, 255, 255],
                fontSize: 7,
                fontStyle: 'bold',
            },
            horizontalPageBreak: true,
            horizontalPageBreakRepeat: 0,
            margin: { top: 18, left: 5, right: 5, bottom: 10 },
            theme: 'grid',
        });

        doc.save('Farmer_Collection.pdf');
    };

    const exportCSV = () => {
        if (!collectionList.length) {
            notify('No data available to export', 'warning');
            return;
        }

        const headers = orderedColumns.map(
            col => columnMap[col.column]?.header || '',
        );

        const rows = collectionList.map(item =>
            orderedColumns.map(col => columnMap[col.column]?.cell(item) ?? ''),
        );

        const escapeCSV = (value: any) =>
            `"${String(value ?? '').replace(/"/g, '""')}"`;

        const csv = [
            headers.map(escapeCSV).join(','),
            ...rows.map(row => row.map(escapeCSV).join(',')),
        ].join('\r\n');

        const blob = new Blob(['\ufeff' + csv], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Farmer_Collection.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const inputClass =
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

    const labelClass = 'mb-1.5 block text-sm font-semibold text-slate-800';

    const summaryCards = [
        { title: 'Total Liter', value: totals.liter, icon: '🥛', style: 'border-blue-200 bg-blue-50 text-blue-700' },
        { title: 'Fat', value: totals.fat, icon: '🧪', style: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
        { title: 'SNF', value: totals.snf, icon: '💧', style: 'border-orange-200 bg-orange-50 text-orange-700' },
        { title: 'Total Farmer', value: totals.farmers, icon: '👨‍🌾', style: 'border-rose-200 bg-rose-50 text-rose-700' },
    ];


    return (
        <div className="space-y-5">
            <PageHeader
                title="Farmer Collection"
                subtitle="Manage and view farmer milk collection reports."
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            icon={<FileSpreadsheet size={16} />}
                            onClick={exportExcel}
                        >
                            Excel Export
                        </Button>

                        <Button
                            variant="outline"
                            icon={<FileText size={16} />}
                            onClick={exportPDF}
                        >
                            PDF Export
                        </Button>

                        <Button
                            variant="outline"
                            icon={<Download size={16} />}
                            onClick={exportCSV}
                        >
                            CSV Export
                        </Button>
                    </div>
                }
            />


            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {summaryCards.map(card => (
                    <Card key={card.title} className="p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wider text-mute">
                                    {card.title}
                                </p>
                                {/* <p className="mt-1 text-2xl font-extrabold tnum">
                                    {nf(Number(card.value))}
                                </p> */}
                                <p className="mt-1 text-2xl font-extrabold tnum">
                                    {card.title === 'Total Farmer'
                                        ? Number(card.value).toLocaleString('en-IN')
                                        : Number(card.value).toFixed(2)}
                                </p>
                            </div>

                            <span className="text-2xl">{card.icon}</span>
                        </div>
                    </Card>
                ))}
            </div>


            <Card className="p-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                    <label className="text-sm">
                        <span className="mb-1 block font-semibold text-slate-800">
                            Branch Name
                        </span>
                        <Select
                            value={filters.branchId}
                            onChange={e => void changeBranch(e.target.value)}
                        >
                            <option value="All">All Branches</option>
                            {branches.map((branch, index) => (
                                <option
                                    key={`${branch.BranchId}-${index}`}
                                    value={String(branch.BranchId)}
                                >
                                    {branch.BranchId} | {branch.BranchName}
                                </option>
                            ))}
                        </Select>
                    </label>

                    <label className="text-sm">
                        <span className="mb-1 block font-semibold text-slate-800">
                            Route
                        </span>
                        <Select
                            value={filters.routeId}
                            onChange={e => applyRoute(e.target.value, routeList)}
                        >
                            <option value="All">All Routes</option>
                            {routeList.map((route, index) => (
                                <option
                                    key={`${route.RouteId}-${index}`}
                                    value={String(route.RouteId)}
                                >
                                    {route.RouteId} | {route.RouteName}
                                </option>
                            ))}
                        </Select>
                    </label>

                    <label className="text-sm">
                        <span className="mb-1 block font-semibold text-slate-800">
                            Farmer Name
                        </span>
                        <Select
                            value={filters.farmerId}
                            onChange={e => updateFilter('farmerId', e.target.value)}
                        >
                            <option value="All">All Farmers</option>
                            {farmerList.map((farmer, index) => (
                                <option
                                    key={`${farmer.AcCode}-${index}`}
                                    value={String(farmer.AcCode)}
                                >
                                    {farmer.AcCode} | {farmer.AcName}
                                </option>
                            ))}
                        </Select>
                    </label>

                    <label className="text-sm">
                        <span className="mb-1 block font-semibold text-slate-800">
                            Milk Type
                        </span>
                        <Select
                            value={filters.milkType}
                            onChange={e => updateFilter('milkType', e.target.value)}
                        >
                            <option value="z">Both</option>
                            <option value="C">Cow</option>
                            <option value="B">Buffalo</option>
                            <option value="M">Mix</option>
                        </Select>
                    </label>

                    <label className="text-sm">
                        <span className="mb-1 block font-semibold text-slate-800">
                            Shift
                        </span>
                        <Select
                            value={filters.shift}
                            onChange={e => updateFilter('shift', e.target.value)}
                        >
                            <option value="z">Both</option>
                            <option value="M">Morning</option>
                            <option value="E">Evening</option>
                        </Select>
                    </label>

                    <label className="text-sm">
                        <span className="mb-1 block font-semibold text-slate-800">
                            From Date
                        </span>
                        <Input
                            type="date"
                            value={filters.fromDate}
                            onChange={e => updateFilter('fromDate', e.target.value)}
                        />
                    </label>

                    <label className="text-sm">
                        <span className="mb-1 block font-semibold text-slate-800">
                            To Date
                        </span>
                        <Input
                            type="date"
                            value={filters.toDate}
                            onChange={e => updateFilter('toDate', e.target.value)}
                        />
                    </label>

                    <div className="flex items-end gap-2">
                        <Button
                            icon={<Search size={16} />}
                            disabled={loading}
                            onClick={() => void loadList()}
                        >
                            {loading ? 'Loading...' : 'Search'}
                        </Button>

                        <Button
                            variant="outline"
                            icon={<RefreshCw size={16} />}
                            onClick={() => {
                                setFilters(initialFilters);
                                setRouteList(getRoutesForBranches(branches));
                                setFarmerList(uniqueBy(
                                    getRoutesForBranches(branches).flatMap(
                                        route => route.Accounts || []
                                    ),
                                    'AcCode',
                                ));
                            }}
                        >
                            Reset
                        </Button>
                    </div>
                </div>
            </Card>


            <Card>
                <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
                    <div>
                        <h3 className="font-bold text-slate-900">
                            Collection Details
                        </h3>
                        <p className="mt-1 text-xs text-mute">
                            Total records: {collectionList.length}
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-line text-left">
                                {orderedColumns.map(col => (
                                    <th
                                        key={col.column}
                                        className="whitespace-nowrap px-4 py-3 font-semibold"
                                    >
                                        {columnMap[col.column]?.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={Math.max(orderedColumns.length, 1)}
                                        className="px-4 py-8 text-center"
                                    >
                                        Loading Farmer Collection...
                                    </td>
                                </tr>
                            ) : paginatedList.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={Math.max(orderedColumns.length, 1)}
                                        className="px-4 py-8 text-center text-mute"
                                    >
                                        No records found. Select filters and click Search.
                                    </td>
                                </tr>
                            ) : (
                                paginatedList.map((item, index) => (
                                    <tr
                                        key={`${item.BranchId}-${item.DocNo ?? item.TrDate}-${item.SupCode}-${index}`}
                                        className="border-b border-line hover:bg-slate-50"
                                    >
                                        {orderedColumns.map(col => (
                                            <td
                                                key={col.column}
                                                className="whitespace-nowrap px-4 py-3"
                                            >
                                                {columnMap[col.column]?.cell(item) ?? ''}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-line p-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm text-mute">
                        {collectionList.length === 0
                            ? '0 records'
                            : `${pageIndex * pageSize + 1}–${Math.min(
                                (pageIndex + 1) * pageSize,
                                collectionList.length
                            )} of ${collectionList.length}`}
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                        <label className="text-sm text-mute">
                            Rows:
                            <Select
                                value={String(pageSize)}
                                onChange={e => {
                                    setPageSize(Number(e.target.value));
                                    setPageIndex(0);
                                }}
                            >
                                <option value="100">100</option>
                                <option value="200">200</option>
                                <option value="500">500</option>
                            </Select>
                        </label>

                        <Button
                            variant="outline"
                            disabled={pageIndex === 0}
                            onClick={() => setPageIndex(0)}
                        >
                            First
                        </Button>

                        <Button
                            variant="outline"
                            disabled={pageIndex === 0}
                            onClick={() => setPageIndex(p => Math.max(0, p - 1))}
                        >
                            Previous
                        </Button>

                        <span className="px-2 text-sm text-mute">
                            {pageCount === 0 ? 0 : pageIndex + 1} / {pageCount}
                        </span>

                        <Button
                            variant="outline"
                            disabled={pageCount === 0 || pageIndex >= pageCount - 1}
                            onClick={() => setPageIndex(p => Math.min(pageCount - 1, p + 1))}
                        >
                            Next
                        </Button>

                        <Button
                            variant="outline"
                            disabled={pageCount === 0 || pageIndex >= pageCount - 1}
                            onClick={() => setPageIndex(Math.max(0, pageCount - 1))}
                        >
                            Last
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );

}
