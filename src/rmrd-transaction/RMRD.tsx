import { useCallback, useEffect, useState } from 'react';
import { environment } from '../config/environment';
import { useToast } from '../context/ToastContext';
import { getRMRDList, saveRMRD, } from '../services/rmrd.service';
import { Search, Save, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Input, Select } from '../components/ui/Fields';
import { nf } from '../lib/format';


type RMRDRow = {
    CodeNo?: number;
    BranchId?: number;
    DocNo?: number;
    RouteId?: number;
    MCCId?: number;
    VillageId?: number;
    SupCode?: number;
    AcName?: string;
    SampleNo?: number;
    MilkType?: string;
    Shift?: string;
    RecCan?: number;
    AccCan?: number;
    WeightKilo?: number;
    WeightLiter?: number;
    SourMilkCan?: number;
    SourMilkLiter?: number;
    MixCan?: number;
    MixMilk?: number;
    Fat?: number;
    KgFat?: number;
    SNF?: number;
    KgSNF?: number;
    Protein?: number;
    KgProtein?: number;
    Mbrt?: number;
    CLR?: number;
    Acidity?: number;
    Temperature?: number;
    Matter?: number;
    Rate?: number;
    KgFatRate?: number;
    KgSNFRate?: number;
    KgFatAmt?: number;
    KgSNFAmt?: number;
    Amount?: number;
    Commission?: number;
    Transport?: number;
    SourAmt?: number;
    MixAmt?: number;
    RefDoc?: string;
    AutoEntry?: number;
    AccFlag?: number;
    Degree?: number;
    SourMilkKilo?: number;
};

const todayISO = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const numberValue = (value: unknown) => Number(value) || 0;


const columns = [
    'Name',
    'S No',
    'M Type',
    'Shift',
    'Wt Kg',
    'Wt Ltr',
    'Fat',
    'SNF',
    'Degree',
    'Rate',
    'Amount',
    'Kg Fat',
    'Kg SNF',
    'Kg CLR',
    'Sour Kg',
    'Sour Ltr',
];




export default function RMRD() {
    const toast = useToast();

    const [milkType, setMilkType] = useState('C');
    const [shift, setShift] = useState('M');
    const [trDate, setTrDate] = useState(todayISO());

    const [rmrdList, setRmrdList] = useState<RMRDRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const loadRMRDList = useCallback(async () => {
        const branchId = localStorage.getItem('combinedId') || '';

        if (!branchId) {
            setRmrdList([]);
            toast('Please select a branch');
            return;
        }

        if (!trDate) {
            toast('Please select a date');
            return;
        }

        console.log('Selected Date:', trDate);

        setIsLoading(true);

        try {
            const data = await getRMRDList(
                environment.staticIP1,
                branchId,
                milkType,
                shift,
                trDate,
            );


            console.log('Complete API data:', data);

            const rows = Array.isArray(data) ? data : data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? [];
            // console.log('Rows for table:', rows);
            // console.log('Rows count:', Array.isArray(rows) ? rows.length : 'Not an array');

            setRmrdList(Array.isArray(rows) ? rows : []);

        } catch (error) {
            console.error('RMRD list error:', error);
            setRmrdList([]);

            toast(error instanceof Error ? error.message : 'Error loading RMRD list',);
        } finally {
            setIsLoading(false);
        }
    }, [milkType, shift, trDate, toast]);


    useEffect(() => {
        void loadRMRDList();
    }, [loadRMRDList]);

    const onReset = () => {
        setTrDate(todayISO());
        setShift('M');
        setMilkType('C');
    };

    const onSave = async () => {
        if (!rmrdList.length) {
            toast('No records to save!');
            return;
        }

        const branchId = Number(localStorage.getItem('combinedId')) || 0;
        const companyId = localStorage.getItem('companyId') || '0';
        const userId = Number(localStorage.getItem('userId')) || 0;
        const currentDate = new Date().toISOString();

        const saveData = rmrdList.map((item) => ({
            codeNo: item.CodeNo || 0,
            branchId: item.BranchId || branchId,
            docNo: item.DocNo || 0,
            trDate,
            routeId: item.RouteId || 0,
            mccID: item.MCCId || 0,
            villageId: item.VillageId || 0,
            supCode: item.SupCode || 0,
            sampleNo: item.SampleNo || 0,
            milkType: item.MilkType || milkType,
            shift: item.Shift || shift,
            recCan: item.RecCan || 0,
            accCan: item.AccCan || 0,
            weightKilo: item.WeightKilo || 0,
            weightLiter: item.WeightLiter || 0,
            sourMilkCan: item.SourMilkCan || 0,
            sourMilk: item.SourMilkLiter || 0,
            mixCan: item.MixCan || 0,
            mixMilk: item.MixMilk || 0,
            fat: item.Fat || 0,
            kgFat: item.KgFat || 0,
            snf: item.SNF || 0,
            kgSNF: item.KgSNF || 0,
            protein: item.Protein || 0,
            kgProtein: item.KgProtein || 0,
            digri: item.Mbrt || 0,
            kgDigri: item.CLR || 0,
            acidity: item.Acidity || 0,
            temperature: item.Temperature || 0,
            mbrt: item.Mbrt || 0,
            matter: item.Matter || 0,
            rate: item.Rate || 0,
            kgFatRate: item.KgFatRate || 0,
            kgSNFRate: item.KgSNFRate || 0,
            kgFatAmt: item.KgFatAmt || 0,
            kgSNFAmt: item.KgSNFAmt || 0,
            totalAmt: item.Amount || 0,
            commission: item.Commission || 0,
            transport: item.Transport || 0,
            sourAmt: item.SourAmt || 0,
            mixAmt: item.MixAmt || 0,
            refDoc: item.RefDoc || '',
            autoEntry: item.AutoEntry || 0,
            accFlag: item.AccFlag || 0,
            unloadTime: currentDate,
            createdBy: userId,
            createdDateTime: currentDate,
            modifyBy: userId,
            modifyDateTime: currentDate,
            companyId,
        }));


        setIsSaving(true);

        try {
            const result = await saveRMRD(environment.staticIP1, 0, saveData,);
            toast(result?.message || result?.Message || 'Data Saved Successfully',);

            onReset();
            setRmrdList([]);
        } catch (error) {
            console.error('RMRD save error:', error);
            toast(error instanceof Error ? error.message : 'Error while saving',);

        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="space-y-5">

            <PageHeader
                title="RMRD Process"
                subtitle="Manage RMRD records, milk quality and payment details."

            />


            <Card className="p-4">
                <div className="grid gap-4 md:grid-cols-4">

                    <label className="text-sm">
                        <span className="mb-1 block">Milk Type *</span>

                        <Select
                            value={milkType}
                            onChange={(e) => setMilkType(e.target.value)}
                        >
                            <option value="C">Cow</option>
                            <option value="B">Buffalo</option>
                            <option value="M">Mix</option>
                        </Select>
                    </label>

                    <label className="text-sm">
                        <span className="mb-1 block">Shift *</span>

                        <Select
                            value={shift}
                            onChange={(e) => setShift(e.target.value)}
                        >
                            <option value="M">Morning</option>
                            <option value="E">Evening</option>
                        </Select>
                    </label>

                    <label className="text-sm">
                        <span className="mb-1 block">Transaction Date *</span>

                        <Input
                            type="date"
                            value={trDate}
                            onChange={(e) => setTrDate(e.target.value)}
                        />
                    </label>

                    <div className="flex items-end gap-2">
                        <Button
                            icon={<Search size={16} />}
                            disabled={isLoading || isSaving}
                            onClick={() => void loadRMRDList()}
                        >
                            {isLoading ? 'Loading...' : 'Search'}
                        </Button>

                        <Button
                            variant="outline"
                            icon={<RefreshCw size={16} />}
                            disabled={isLoading || isSaving}
                            onClick={onReset}
                        >
                            Reset
                        </Button>
                    </div>

                </div>
            </Card>

            {/* RMRD Records Table */}
            <Card>
                <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">

                    <div>
                        <h2 className="font-semibold">
                            RMRD Records
                        </h2>

                        <p className="mt-1 text-sm text-mute">
                            Pending milk collection and quality details
                        </p>
                    </div>

                    <span className="ml-auto text-sm text-mute">
                        {rmrdList.length} records
                    </span>

                    <Button
                        disabled={
                            isLoading ||
                            isSaving ||
                            rmrdList.length === 0
                        }
                        icon={<Save size={16} />}
                        onClick={() => void onSave()}
                    >
                        {isSaving ? 'Saving...' : 'Save All'}
                    </Button>

                </div>

                <div className="overflow-x-auto">

                    <table className="w-full text-sm">

                        <thead>
                            <tr className="border-b border-line text-left">
                                {columns.map((column) => (
                                    <th
                                        key={column}
                                        className="whitespace-nowrap px-4 py-3 font-semibold"
                                    >
                                        {column}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="px-4 py-10 text-center text-mute"
                                    >
                                        <div className="flex items-center justify-center gap-3">
                                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                            Loading RMRD records...
                                        </div>
                                    </td>
                                </tr>
                            ) : rmrdList.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="px-4 py-10 text-center text-mute"
                                    >
                                        No records found
                                    </td>
                                </tr>
                            ) : (
                                rmrdList.map((item, index) => (
                                    <tr
                                        key={`${item.CodeNo ?? item.SampleNo ?? 'row'}-${index}`}
                                        className="border-b border-line hover:bg-blue-50/50"
                                    >
                                        <td
                                            className="max-w-56 truncate px-4 py-3"
                                            title={item.AcName || ''}
                                        >
                                            {item.AcName || ''}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            {item.SampleNo ?? 0}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            {item.MilkType === 'C'
                                                ? 'Cow'
                                                : item.MilkType === 'B'
                                                    ? 'Buffalo'
                                                    : item.MilkType === 'M'
                                                        ? 'Mix'
                                                        : item.MilkType || ''}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            {item.Shift === 'M'
                                                ? 'Morning'
                                                : item.Shift === 'E'
                                                    ? 'Evening'
                                                    : item.Shift || ''}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            {nf(numberValue(item.WeightKilo))}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            {nf(numberValue(item.WeightLiter))}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            {nf(numberValue(item.Fat))}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            {nf(numberValue(item.SNF))}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            {nf(numberValue(item.Mbrt ?? item.Degree))}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            {nf(numberValue(item.Rate))}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            {nf(numberValue(item.Amount))}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            {nf(numberValue(item.KgFat))}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            {nf(numberValue(item.KgSNF))}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            {nf(numberValue(item.CLR))}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            {nf(numberValue(item.SourMilkKilo))}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            {nf(numberValue(item.SourMilkLiter))}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>

                    </table>

                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4">
                    <span className="text-sm text-mute">
                        Total Records: {rmrdList.length}
                    </span>

                    {/* <span className="text-sm font-semibold">
                    Total Amount: {nf(totalAmount)}
                </span> */}
                </div>

            </Card>

        </div>
    );

}
