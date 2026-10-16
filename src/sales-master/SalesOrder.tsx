import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from 'react';

import {
    Plus,
    Search,
    Save,
    RefreshCw,
    X,
    Pencil,
    Trash2,
    Smartphone,
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Input } from '../components/ui/Fields';
import { useToast } from '../context/ToastContext';
import { todayISO } from '../lib/format';

import {
    getSalesOrderList,
    getSalesOrderById,
    getAppOrderList,
    getAppOrderById,
    saveSalesOrder,
    deleteSalesOrder,
    getBranchList,
    getAccountList,
    getCategoryList,
} from '../services/sales-order.service';
import { environment } from '../config/environment';

type AnyRow = Record<string, any>;

type OrderItem = {
    orderid: number | string;
    agencyname: string;
    item: string;
    itemId: number;
    crate: number;
    kg: number;
    qty: number;
    rate: number;
    amount: number;
    discount: number;
    disamount: number;
    taxableamt: number;
    gstper: number;
    sgst: number;
    sgstamt: number;
    cgst: number;
    cgstamt: number;
    igst: number;
    igstamt: number;
    totalamt: number;
    narration: string;
    stateId: number;
    isInterstate: boolean;
};

type OrderForm = {
    txtorder: string;
    txtagencyname: string;
    txtconsignee: string;
    txtmasterid: string;
    dpudate: string;
    cmbbranch: string;
    cmbcategory: string;
    cmbsubcate: string;
    txtselectitem: string;
    cmbbucket: string;
    txtcrate: string;
    txtqty: string;
    txtltrkg: string;
    txtrate: string;
    txtamount: string;
    txtdiscount: string;
    txtdisamount: string;
    txtnarration: string;
};

const initialForm = (): OrderForm => ({
    txtorder: '',
    txtagencyname: '',
    txtconsignee: '',
    txtmasterid: '',
    dpudate: todayISO(),
    cmbbranch: '',
    cmbcategory: '',
    cmbsubcate: '',
    txtselectitem: '',
    cmbbucket: '10',
    txtcrate: '0',
    txtqty: '0',
    txtltrkg: '0',
    txtrate: '0',
    txtamount: '0',
    txtdiscount: '0',
    txtdisamount: '0',
    txtnarration: '',
});

// function getArray(data: any): any[] {
//     if (typeof data === 'string') {
//         try {
//             data = JSON.parse(data);
//         } catch {
//             return [];
//         }
//     }


function getArray(data: any): any[] {
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch {
            return [];
        }
    }

    if (Array.isArray(data)) return data;

    if (!data || typeof data !== 'object') return [];

    const keys = [
        'data',
        'Data',
        'result',
        'Result',
        'Table',
        'Table1',
        'rows',
        'Rows',
        'items',
        'Items',
    ];

    for (const key of keys) {
        if (data[key] != null) {
            const result = getArray(data[key]);

            if (result.length > 0) return result;
        }
    }

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

const money = (value: unknown) => Number(Number(value || 0).toFixed(2));
const cleanNumber = (value: unknown) => Number(value) || 0;

function getAccounts(data: any): AnyRow[] {
    const result: AnyRow[] = [];

    const visit = (value: any): void => {
        if (!value) return;

        if (Array.isArray(value)) {
            value.forEach(visit);
            return;
        }

        if (Array.isArray(value.Accounts)) {
            result.push(...value.Accounts);
        }

        if (Array.isArray(value.Branches)) visit(value.Branches);
        if (Array.isArray(value.MCC)) visit(value.MCC);
        if (Array.isArray(value.Routes)) visit(value.Routes);
        if (Array.isArray(value.Table)) visit(value.Table);
    };

    visit(data);

    const unique = new Map<number, AnyRow>();
    result.forEach(account => {
        unique.set(Number(account.AcCode), account);
    });

    return [...unique.values()];
}

function getCategoryItems(categories: AnyRow[]): AnyRow[] {
    return categories.flatMap(category =>
        (category.SubCategories || []).flatMap((sub: AnyRow) => sub.Items || []),
    );
}

export default function SalesOrder() {
    const toast = useToast();

    const apiUrl = environment.staticIP1;

    const [view, setView] = useState<'list' | 'form' | 'app'>('list');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [orders, setOrders] = useState<AnyRow[]>([]);
    const [appOrders, setAppOrders] = useState<AnyRow[]>([]);
    const [branches, setBranches] = useState<AnyRow[]>([]);
    const [agencies, setAgencies] = useState<AnyRow[]>([]);
    const [consignees, setConsignees] = useState<AnyRow[]>([]);
    const [categories, setCategories] = useState<AnyRow[]>([]);

    const [fromDate, setFromDate] = useState(todayISO());
    const [toDate, setToDate] = useState(todayISO());

    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [editMode, setEditMode] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(0);
    const [selectedAppOrder, setSelectedAppOrder] = useState<AnyRow | null>(null);

    const [rows, setRows] = useState<OrderItem[]>([]);
    const [form, setForm] = useState<OrderForm>(initialForm());
    const [deleteItem, setDeleteItem] = useState<AnyRow | null>(null);

    const branchId = localStorage.getItem('combinedId') || '';
    const userId = Number(localStorage.getItem('userId') || 0);
    const companyId = Number(localStorage.getItem('companyId') || 0);

    const updateField = (name: keyof OrderForm, value: string) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // ========== Derived ==========
    const selectedCategory = categories.find(
        c => Number(c.CategoryId) === Number(form.cmbcategory),
    );

    const subCategories: AnyRow[] = selectedCategory?.SubCategories || [];

    const selectedSubCategory = subCategories.find(
        s => Number(s.SubCategoryId) === Number(form.cmbsubcate),
    );

    const items: AnyRow[] = selectedSubCategory?.Items || [];

    const selectedItem = items.find(
        i => Number(i.ItemId) === Number(form.txtselectitem),
    );

    const agencyName = (code: unknown) =>
        agencies.find(a => Number(a.AcCode) === Number(code))?.AcName || '';

    const itemName = (id: unknown) =>
        getCategoryItems(categories).find(
            i => Number(i.ItemId) === Number(id),
        )?.ItemName || '';

    // ========== Load List ==========
    const loadList = useCallback(async () => {
        if (!branchId) {
            setOrders([]);
            return;
        }

        setLoading(true);

        try {
            const response = await getSalesOrderList(apiUrl, branchId, fromDate, toDate);

            console.log('Sales Order Parsed Response:', response);

            const orderData = getArray(response);

            console.log('Sales Order List Rows:', orderData);

            setOrders(orderData);
            setPageIndex(0);
        } catch (error) {
            console.error('Sales order list error:', error);
            setOrders([]);
            toast(
                error instanceof Error
                    ? error.message
                    : 'Unable to load Sales Order list.',
            );
        } finally {
            setLoading(false);
        }
    }, [branchId, fromDate, toDate, toast]);

    // ========== Load App Orders ==========
    const loadAppOrders = useCallback(async () => {
        if (!branchId) {
            setAppOrders([]);
            return;
        }

        try {
            const response = await getAppOrderList(apiUrl, branchId);
            setAppOrders(getArray(response));
        } catch (error) {
            console.error('App order list error:', error);
            setAppOrders([]);
            toast(
                error instanceof Error
                    ? error.message
                    : 'Unable to load App Orders.',
            );
        }
    }, [branchId, toast]);

    // ========== Load Masters ==========
    const loadMasters = useCallback(async () => {
        try {
            const firmId = localStorage.getItem('firmId') || '0';

            const [branchRes, agencyRes, consigneeRes, categoryRes] =
                await Promise.all([
                    getBranchList(apiUrl),
                    getAccountList(apiUrl, 'C'),
                    getAccountList(apiUrl, 'N/A'),
                    getCategoryList(apiUrl, firmId),
                ]);

            const branchData = getArray(branchRes);
            const agencyData = getAccounts(agencyRes);
            const consigneeData = getAccounts(consigneeRes);
            const categoryData = getArray(categoryRes);

            setBranches(branchData);
            setAgencies(agencyData);
            setConsignees(consigneeData);
            setCategories(categoryData);

            setForm(prev => ({
                ...prev,
                cmbbranch: prev.cmbbranch || String(branchData[0]?.BranchId || ''),
                txtagencyname:
                    prev.txtagencyname || String(agencyData[0]?.AcCode || ''),
                txtconsignee:
                    prev.txtconsignee || String(consigneeData[0]?.AcCode || ''),
                cmbcategory:
                    prev.cmbcategory || String(categoryData[0]?.CategoryId || ''),
                cmbsubcate:
                    prev.cmbsubcate ||
                    String(categoryData[0]?.SubCategories?.[0]?.SubCategoryId || ''),
                txtselectitem:
                    prev.txtselectitem ||
                    String(categoryData[0]?.SubCategories?.[0]?.Items?.[0]?.ItemId || ''),
                txtrate:
                    prev.txtrate === '0'
                        ? String(categoryData[0]?.SubCategories?.[0]?.Items?.[0]?.Rate || 0)
                        : prev.txtrate,
            }));
        } catch (error) {
            console.error('Sales order masters error:', error);
            setBranches([]);
            setAgencies([]);
            setConsignees([]);
            setCategories([]);
            toast(
                error instanceof Error
                    ? error.message
                    : 'Unable to load dropdowns.',
            );
        }
    }, [toast]);

    useEffect(() => {
        void loadMasters();
    }, [loadMasters]);

    useEffect(() => {
        void loadList();
    }, [loadList]);

    useEffect(() => {
        void loadAppOrders();
    }, [loadAppOrders]);

    // ========== Row Calculation ==========
    const calculateRow = (
        item: AnyRow,
        values: Partial<OrderItem>,
    ): OrderItem => {
        const qty = cleanNumber(values.qty);
        const crate = cleanNumber(values.crate);
        const kg = cleanNumber(values.kg);
        const rate = cleanNumber(values.rate);
        const discount = cleanNumber(values.discount);

        const amount = money(kg * rate);
        const disamount = money((amount * discount) / 100);
        const taxableamt = money(amount - disamount);

        const gstper =
            cleanNumber(values.gstper) ||
            cleanNumber(item.O_VAT) + cleanNumber(item.M_VAT);

        const stateId = cleanNumber(values.stateId);
        const isInterstate = values.isInterstate ?? stateId !== 17;

        const sgst = isInterstate ? 0 : gstper / 2;
        const cgst = isInterstate ? 0 : gstper / 2;
        const igst = isInterstate ? gstper : 0;

        const sgstamt = money((taxableamt * sgst) / 100);
        const cgstamt = money((taxableamt * cgst) / 100);
        const igstamt = money((taxableamt * igst) / 100);

        return {
            orderid: values.orderid || form.txtorder || 'Auto',
            agencyname: values.agencyname || agencyName(form.txtagencyname),
            item: values.item || item.ItemName || '',
            itemId: cleanNumber(values.itemId) || cleanNumber(item.ItemId),
            crate,
            kg,
            qty,
            rate,
            amount,
            discount,
            disamount,
            taxableamt,
            gstper,
            sgst,
            sgstamt,
            cgst,
            cgstamt,
            igst,
            igstamt,
            totalamt: money(taxableamt + sgstamt + cgstamt + igstamt),
            narration: values.narration || '',
            stateId,
            isInterstate,
        };
    };

    const updateCalculation = (changes: Partial<OrderForm>) => {
        const next = { ...form, ...changes };
        const bucket = cleanNumber(next.cmbbucket) || 10;

        let crate = cleanNumber(next.txtcrate);
        let qty = cleanNumber(next.txtqty);
        let kg = cleanNumber(next.txtltrkg);

        if ('txtcrate' in changes) {
            qty = crate * bucket;
            kg = qty * bucket;
        } else if ('txtqty' in changes) {
            crate = qty / bucket;
            kg = qty * bucket;
        } else if ('cmbbucket' in changes) {
            if (crate > 0) {
                qty = crate * bucket;
                kg = qty * bucket;
            } else if (qty > 0) {
                crate = qty / bucket;
                kg = qty * bucket;
            }
        }

        const rate = cleanNumber(next.txtrate);
        const amount = money(kg * rate);
        const discount = cleanNumber(next.txtdiscount);
        const disamount = money((amount * discount) / 100);

        setForm({
            ...next,
            txtcrate: String(crate),
            txtqty: String(qty),
            txtltrkg: String(kg),
            txtamount: String(amount),
            txtdisamount: String(disamount),
        });
    };

    const resetProductFields = () => {
        setForm(prev => ({
            ...prev,
            txtcrate: '0',
            txtqty: '0',
            txtltrkg: '0',
            txtrate: String(selectedItem?.Rate || 0),
            txtamount: '0',
            txtdiscount: '0',
            txtdisamount: '0',
            txtnarration: '',
        }));
    };

    const addItem = () => {
        if (!form.txtagencyname) {
            toast('Please select Customer Name!');
            return;
        }

        if (!selectedItem) {
            toast('Please select Item!');
            return;
        }

        const account = agencies.find(
            a => Number(a.AcCode) === Number(form.txtagencyname),
        );

        const stateId = cleanNumber(account?.StateId);

        const newRow = calculateRow(selectedItem, {
            orderid: form.txtorder || 'Auto',
            agencyname: agencyName(form.txtagencyname),
            item: selectedItem.ItemName,
            itemId: Number(form.txtselectitem),
            crate: cleanNumber(form.txtcrate),
            qty: cleanNumber(form.txtqty),
            kg: cleanNumber(form.txtltrkg),
            rate: cleanNumber(form.txtrate),
            discount: cleanNumber(form.txtdiscount),
            stateId,
            isInterstate: stateId !== 17,
            narration: form.txtnarration,
        });

        setRows(prev => [...prev, newRow]);
        resetProductFields();
    };

    const updateRow = (
        index: number,
        field: keyof OrderItem,
        value: string,
    ) => {
        setRows(prev =>
            prev.map((row, i) => {
                if (i !== index) return row;

                const updated = { ...row, [field]: cleanNumber(value) };

                if (field === 'qty') {
                    updated.crate = updated.qty / 2;
                    updated.kg = updated.crate * updated.qty;
                } else if (field === 'crate') {
                    updated.qty = updated.crate * 2;
                    updated.kg = updated.crate * updated.qty;
                }

                const item =
                    getCategoryItems(categories).find(
                        x => Number(x.ItemId) === Number(updated.itemId),
                    ) || {};

                return calculateRow(item, updated);
            }),
        );
    };

    const totals = useMemo(
        () =>
            rows.reduce(
                (sum, row) => ({
                    crate: sum.crate + row.crate,
                    qty: sum.qty + row.qty,
                    rate: sum.rate + row.rate,
                    amount: sum.amount + row.amount,
                    discount: sum.discount + row.disamount,
                    taxable: sum.taxable + row.taxableamt,
                    sgst: sum.sgst + row.sgstamt,
                    cgst: sum.cgst + row.cgstamt,
                    igst: sum.igst + row.igstamt,
                    total: sum.total + row.totalamt,
                }),
                {
                    crate: 0,
                    qty: 0,
                    rate: 0,
                    amount: 0,
                    discount: 0,
                    taxable: 0,
                    sgst: 0,
                    cgst: 0,
                    igst: 0,
                    total: 0,
                },
            ),
        [rows],
    );

    // ========== Open / Close ==========
    const openForm = () => {
        setEditMode(false);
        setSelectedOrderId(0);
        setSelectedAppOrder(null);
        setRows([]);

        setForm({
            ...initialForm(),
            cmbbranch: String(branches[0]?.BranchId || ''),
            txtagencyname: String(agencies[0]?.AcCode || ''),
            txtconsignee: String(consignees[0]?.AcCode || ''),
            cmbcategory: String(categories[0]?.CategoryId || ''),
            cmbsubcate: String(
                categories[0]?.SubCategories?.[0]?.SubCategoryId || '',
            ),
            txtselectitem: String(
                categories[0]?.SubCategories?.[0]?.Items?.[0]?.ItemId || '',
            ),
            txtrate: String(
                categories[0]?.SubCategories?.[0]?.Items?.[0]?.Rate || 0,
            ),
        });

        setView('form');
    };

    const closeForm = () => {
        setView('list');
        setRows([]);
        setForm(initialForm());
        setEditMode(false);
        setSelectedOrderId(0);
        setSelectedAppOrder(null);
    };

    const resetForm = () => {
        setForm({
            ...initialForm(),
            cmbbranch: String(branches[0]?.BranchId || ''),
            txtagencyname: String(agencies[0]?.AcCode || ''),
            txtconsignee: String(consignees[0]?.AcCode || ''),
            cmbcategory: String(categories[0]?.CategoryId || ''),
            cmbsubcate: String(
                categories[0]?.SubCategories?.[0]?.SubCategoryId || '',
            ),
            txtselectitem: String(
                categories[0]?.SubCategories?.[0]?.Items?.[0]?.ItemId || '',
            ),
            txtrate: String(
                categories[0]?.SubCategories?.[0]?.Items?.[0]?.Rate || 0,
            ),
        });
        setRows([]);
    };

    // ========== Edit ==========
    const editOrder = async (order: AnyRow) => {
        const id = Number(order.SalesNo ?? 0);

        if (!id) {
            toast('Sales Order ID is missing.');
            return;
        }

        setLoading(true);

        try {
            const response = await getSalesOrderById(apiUrl, id);
            const data = getObject(response);

            setEditMode(true);
            setSelectedOrderId(id);

            setForm({
                ...initialForm(),
                txtorder: String(data.salesNo ?? order.SalesNo ?? ''),
                txtagencyname: String(data.acCode ?? ''),
                txtconsignee: String(data.consignee ?? ''),
                txtmasterid: String(data.orderMasterId ?? ''),
                dpudate: dateValue(data.salesDate),
                cmbbranch: String(data.branchId ?? data.BranchId ?? ''),
                cmbcategory: String(data.categoryId ?? ''),
                cmbsubcate: String(data.subCategoryId ?? ''),
                txtselectitem: String(data.itemId ?? ''),
            });

            const details: AnyRow[] = data.details || [];

            setRows(
                details.map((detail: AnyRow) => {
                    const item =
                        getCategoryItems(categories).find(
                            x => Number(x.ItemId) === Number(detail.itemId),
                        ) || {};

                    return calculateRow(item, {
                        orderid: data.salesNo,
                        agencyname: agencyName(data.acCode),
                        item: item.ItemName || '',
                        itemId: detail.itemId,
                        crate: detail.crate,
                        qty: detail.quantity,
                        kg: detail.liter,
                        rate: detail.unitPrice,
                        discount: detail.discountPercentage,
                        disamount: detail.discountAmount,
                        taxableamt: detail.taxableAmount,
                        gstper: detail.gstPercentage,
                        sgst: detail.sgst,
                        sgstamt: detail.sgstAmount,
                        cgst: detail.cgst,
                        cgstamt: detail.cgstAmount,
                        igst: detail.igst,
                        igstamt: detail.igstAmount,
                        totalamt: detail.total,
                        stateId:
                            agencies.find(
                                a => Number(a.AcCode) === Number(data.acCode),
                            )?.StateId || 0,
                        isInterstate: cleanNumber(detail.igst) > 0,
                    });
                }),
            );

            setView('form');
        } catch (error) {
            console.error('Edit Sales Order error:', error);
            toast(
                error instanceof Error
                    ? error.message
                    : 'Unable to open Sales Order.',
            );
        } finally {
            setLoading(false);
        }
    };

    const editAppOrder = async (order: AnyRow) => {
        setLoading(true);

        try {
            const response = await getAppOrderById(apiUrl, order.OrderId);
            const data = getObject(response);

            setSelectedAppOrder(order);
            setEditMode(false);

            const id = Number(data.ItemId ?? data.itemId ?? 0);
            const qty = cleanNumber(data.ItemQty ?? data.itemQty ?? data.Quantity);
            const rate = cleanNumber(data.ItemPrice ?? data.itemPrice ?? data.Price);

            const item =
                getCategoryItems(categories).find(
                    x => Number(x.ItemId) === id,
                ) || {};

            const accountCode = Number(data.AcCode ?? order.AcCode ?? 0);
            const stateId =
                agencies.find(a => Number(a.AcCode) === accountCode)?.StateId || 0;

            const calculated = calculateRow(item, {
                itemId: id,
                qty,
                crate: qty / 2,
                kg: (qty / 2) * qty,
                rate,
                discount: cleanNumber(data.Discount ?? data.discount),
                stateId,
                isInterstate: stateId !== 17,
                narration: data.Narration || data.narration || '',
            });

            setForm(prev => ({
                ...prev,
                txtagencyname: String(accountCode),
                txtmasterid: String(data.orderId ?? order.OrderMasterId ?? ''),
                cmbbranch: String(
                    data.BranchId ?? data.branchId ?? order.BranchId ?? '',
                ),
                txtselectitem: String(id),
                txtrate: String(rate),
                txtcrate: String(calculated.crate),
                txtqty: String(calculated.qty),
                txtltrkg: String(calculated.kg),
                txtamount: String(calculated.amount),
                txtdiscount: String(calculated.discount),
                txtdisamount: String(calculated.disamount),
                txtnarration: calculated.narration,
            }));

            setRows([calculated]);
            setView('form');
        } catch (error) {
            console.error('Edit App Order error:', error);
            toast(
                error instanceof Error
                    ? error.message
                    : 'Unable to open App Order.',
            );
        } finally {
            setLoading(false);
        }
    };

    // ========== Save ==========
    const submitForm = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!rows.length) {
            toast('Please add at least one item.');
            return;
        }

        if (!form.txtagencyname) {
            toast('Please select Customer Name!');
            return;
        }

        if (!form.dpudate) {
            toast('Please select order date.');
            return;
        }

        const now = new Date().toISOString();

        const payload = {
            branchId: Number(branchId),
            salesNo: editMode ? selectedOrderId : 0,
            orderMasterId: Number(form.txtmasterid) || 0,
            salesDate: form.dpudate || null,
            acCode: Number(form.txtagencyname) || 0,
            consignee: Number(form.txtconsignee) || 0,
            totalCrate: totals.crate,
            totalQuantity: totals.qty,
            totalRate: totals.rate,
            taxableAmount: totals.taxable,
            sgstAmount: totals.sgst,
            cgstAmount: totals.cgst,
            igstAmount: totals.igst,
            discountAmount: totals.discount,
            totalAmount: totals.total,
            roundOff: 0,
            createdBy: userId,
            createdDateTime: now,
            modifyBy: userId,
            modifyDateTime: now,
            companyId,
            details: rows.map(row => ({
                branchId: Number(branchId),
                itemId: row.itemId,
                crate: row.crate,
                quantity: row.qty,
                liter: row.kg,
                unitPrice: row.rate,
                taxableAmount: row.taxableamt,
                gstPercentage: row.gstper,
                sgst: row.sgst,
                sgstAmount: row.sgstamt,
                cgst: row.cgst,
                cgstAmount: row.cgstamt,
                igst: row.igst,
                igstAmount: row.igstamt,
                total: row.totalamt,
                discountPercentage: row.discount,
                discountAmount: row.disamount,
                amount: row.amount,
            })),
        };

        setSaving(true);
        setLoading(true);

        try {
            const response = await saveSalesOrder(apiUrl, editMode ? 1 : 0, payload);
            const result = getObject(response);

            toast(
                result?.message ??
                result?.Message ??
                (editMode
                    ? 'Sales Order updated successfully.'
                    : 'Sales Order saved successfully.'),
            );

            closeForm();
            await loadList();
            await loadAppOrders();
        } catch (error) {
            console.error('Save Sales Order error:', error);
            toast(
                error instanceof Error
                    ? error.message
                    : 'Unable to save Sales Order.',
            );
        } finally {
            setSaving(false);
            setLoading(false);

        }
    };

    // ========== Delete ==========
    const confirmDelete = async () => {
        if (!deleteItem) return;

        const id = Number(deleteItem.SalesNo ?? 0);

        if (!id) {
            toast('Sales Order ID is missing.');
            return;
        }

        setLoading(true);

        try {
            await deleteSalesOrder(apiUrl, id);
            setDeleteItem(null);
            toast('Sales Order deleted successfully.');
            await loadList();
        } catch (error) {
            console.error('Delete Sales Order error:', error);
            toast(
                error instanceof Error
                    ? error.message
                    : 'Unable to delete Sales Order.',
            );
        } finally {
            setLoading(false);
        }
    };

    // ========== Pagination ==========
    const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
    const paginatedOrders = orders.slice(
        pageIndex * pageSize,
        (pageIndex + 1) * pageSize,
    );

    // ========== Render Helpers ==========
    const field = (
        label: string,
        value: string,
        onChange: (value: string) => void,
        type = 'text',
        readOnly = false,
    ) => (
        <label className="block min-w-0 text-sm">
            <span className="mb-1 block font-bold text-slate-900">{label}</span>
            <Input
                type={type}
                value={value}
                readOnly={readOnly}
                onChange={(event: any) => onChange(event.target.value)}
            />
        </label>
    );

    const selectField = (
        label: string,
        value: string,
        options: { label: string; value: string }[],
        onChange: (value: string) => void,
    ) => (
        <label className="block min-w-0 text-sm">
            <span className="mb-1 block font-bold text-slate-900">{label}</span>
            <select
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">Select</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </label>
    );

    return (
        <div className="space-y-5">
            <PageHeader
                title={
                    view === 'form'
                        ? editMode
                            ? 'Edit Sales Order'
                            : 'Add Sales Order'
                        : view === 'app'
                            ? 'App Orders'
                            : 'Sales Order List'
                }
                subtitle="Manage sales orders, items, taxes and totals."
                actions={
                    view === 'list' ? (
                        <Button icon={<Plus size={16} />} onClick={openForm}>
                            Add Sales Order
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            icon={<X size={16} />}
                            onClick={() =>
                                setView(selectedAppOrder ? 'form' : 'list')
                            }
                        >
                            Close
                        </Button>
                    )
                }
            />

            {/* ================= LIST VIEW ================= */}
            {view === 'list' && (
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
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                            </label>

                            <label className="text-sm">
                                <span className="mb-1 block font-bold text-slate-900">
                                    To Date
                                </span>
                                <Input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
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

                                <Button
                                    variant="outline"
                                    icon={<Smartphone size={16} />}
                                    onClick={() => {
                                        void loadAppOrders();
                                        setView('app');
                                    }}
                                >
                                    App
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
                            <h2 className="text-base font-bold">Sales Order List</h2>
                            <span className="ml-auto text-sm text-mute">
                                {orders.length} records
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-line text-left">
                                        {[
                                            'Branch Id',
                                            'S No',
                                            'Customer',
                                            'Quantity',
                                            'Total Amount',
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
                                            <td colSpan={6} className="px-4 py-8 text-center">
                                                Loading records...
                                            </td>
                                        </tr>
                                    ) : paginatedOrders.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-8 text-center text-mute"
                                            >
                                                No records found
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedOrders.map((order, index) => (
                                            <tr
                                                key={`${order.SalesNo}-${index}`}
                                                className="border-b border-line"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {order.BranchId ?? '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {order.SalesNo ?? '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {agencyName(order.AcCode) || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {order.TotalQuantity ?? 0}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {money(order.TotalAmount).toFixed(2)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => void editOrder(order)}
                                                        >
                                                            <Pencil size={14} />
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setDeleteItem(order)}
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
                                    {orders.length === 0
                                        ? 0
                                        : pageIndex * pageSize + 1}
                                    {'–'}
                                    {Math.min(
                                        (pageIndex + 1) * pageSize,
                                        orders.length,
                                    )}
                                    {' of '}
                                    {orders.length}
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
                    </Card>
                </>
            )}

            {/* ================= FORM VIEW ================= */}
            {view === 'form' && (
                <>
                    <Card className="p-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {field(
                                'Order No',
                                form.txtorder,
                                (v) => updateField('txtorder', v),
                                'text',
                                true,
                            )}

                            {selectField(
                                'Customer Name *',
                                form.txtagencyname,
                                agencies.map((a) => ({
                                    label: `${a.AcCode} | ${a.AcName}`,
                                    value: String(a.AcCode),
                                })),
                                (v) => updateField('txtagencyname', v),
                            )}

                            {selectField(
                                'Consignee',
                                form.txtconsignee,
                                consignees.map((a) => ({
                                    label: `${a.AcCode} | ${a.AcName}`,
                                    value: String(a.AcCode),
                                })),
                                (v) => updateField('txtconsignee', v),
                            )}

                            {field(
                                'Date *',
                                form.dpudate,
                                (v) => updateField('dpudate', v),
                                'date',
                            )}

                            {field(
                                'Master Id',
                                form.txtmasterid,
                                (v) => updateField('txtmasterid', v),
                            )}

                            {selectField(
                                'Branch',
                                form.cmbbranch,
                                branches.map((b) => ({
                                    label: `${b.BranchId} | ${b.BranchName}`,
                                    value: String(b.BranchId),
                                })),
                                (v) => updateField('cmbbranch', v),
                            )}

                            {selectField(
                                'Category',
                                form.cmbcategory,
                                categories.map((c) => ({
                                    label: c.CategoryName,
                                    value: String(c.CategoryId),
                                })),
                                (v) => {
                                    const category = categories.find(
                                        c => Number(c.CategoryId) === Number(v),
                                    );
                                    const sub = category?.SubCategories?.[0];
                                    const item = sub?.Items?.[0];

                                    setForm(prev => ({
                                        ...prev,
                                        cmbcategory: v,
                                        cmbsubcate: String(sub?.SubCategoryId || ''),
                                        txtselectitem: String(item?.ItemId || ''),
                                        txtrate: String(item?.Rate || 0),
                                    }));
                                },
                            )}

                            {selectField(
                                'Sub Category',
                                form.cmbsubcate,
                                subCategories.map((sub) => ({
                                    label: sub.SubCategoryName,
                                    value: String(sub.SubCategoryId),
                                })),
                                (v) => {
                                    const sub = subCategories.find(
                                        s => Number(s.SubCategoryId) === Number(v),
                                    );
                                    const item = sub?.Items?.[0];

                                    setForm(prev => ({
                                        ...prev,
                                        cmbsubcate: v,
                                        txtselectitem: String(item?.ItemId || ''),
                                        txtrate: String(item?.Rate || 0),
                                    }));
                                },
                            )}

                            {selectField(
                                'Item',
                                form.txtselectitem,
                                items.map((item) => ({
                                    label: item.ItemName,
                                    value: String(item.ItemId),
                                })),
                                (v) => {
                                    const item = items.find(
                                        i => Number(i.ItemId) === Number(v),
                                    );
                                    setForm(prev => ({
                                        ...prev,
                                        txtselectitem: v,
                                        txtrate: String(item?.Rate || 0),
                                    }));
                                },
                            )}

                            {selectField(
                                'Bucket',
                                form.cmbbucket,
                                ['10', '12', '15'].map((v) => ({
                                    label: v,
                                    value: v,
                                })),
                                (v) => updateCalculation({ cmbbucket: v }),
                            )}

                            {field(
                                'Crate',
                                form.txtcrate,
                                (v) => updateCalculation({ txtcrate: v }),
                                'number',
                            )}

                            {field(
                                'Qty',
                                form.txtqty,
                                (v) => updateCalculation({ txtqty: v }),
                                'number',
                            )}

                            {field(
                                'Ltr/Kg',
                                form.txtltrkg,
                                (v) => updateCalculation({ txtltrkg: v }),
                                'number',
                            )}

                            {field(
                                'Rate',
                                form.txtrate,
                                (v) => updateCalculation({ txtrate: v }),
                                'number',
                            )}

                            {field('Amount', form.txtamount, () => { }, 'number', true)}

                            {field(
                                'Discount %',
                                form.txtdiscount,
                                (v) => updateCalculation({ txtdiscount: v }),
                                'number',
                            )}

                            {field(
                                'Discount Amount',
                                form.txtdisamount,
                                () => { },
                                'number',
                                true,
                            )}

                            <div className="sm:col-span-2 lg:col-span-4">
                                {field(
                                    'Narration',
                                    form.txtnarration,
                                    (v) => updateField('txtnarration', v),
                                )}
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-5">
                            <Button icon={<Plus size={16} />} onClick={addItem}>
                                Add Item
                            </Button>

                            <Button
                                icon={<Save size={16} />}
                                disabled={!rows.length || saving}
                                onClick={() => {
                                    const formEl = document.getElementById(
                                        'sales-order-form',
                                    ) as HTMLFormElement | null;
                                    formEl?.requestSubmit();
                                }}
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </Button>

                            <Button
                                variant="outline"
                                icon={<RefreshCw size={16} />}
                                onClick={resetForm}
                                disabled={saving}
                            >
                                Reset
                            </Button>

                            {selectedAppOrder && (
                                <Button
                                    variant="outline"
                                    onClick={() => setView('app')}
                                >
                                    Back to App Orders
                                </Button>
                            )}
                        </div>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1800px] text-left text-sm">
                                <thead className="bg-[#2B6CB0] text-white">
                                    <tr>
                                        {[
                                            'Order Id',
                                            'Agency Name',
                                            'Item Name',
                                            'Item ID',
                                            'Crate',
                                            'Kg',
                                            'Qty',
                                            'Rate',
                                            'Amount',
                                            'Dis %',
                                            'Dis Amt',
                                            'Taxable Amt',
                                            'GST %',
                                            'SGST Amt',
                                            'CGST Amt',
                                            'IGST Amt',
                                            'Total Amt',
                                            'Narration',
                                            'Actions',
                                        ].map((header) => (
                                            <th
                                                key={header}
                                                className="whitespace-nowrap px-3 py-3 font-semibold"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {rows.map((row, index) => (
                                        <tr
                                            key={`${row.itemId}-${index}`}
                                            className="border-b border-line"
                                        >
                                            <td className="px-3 py-3">{row.orderid}</td>
                                            <td className="px-3 py-3">{row.agencyname}</td>
                                            <td className="px-3 py-3">{row.item}</td>
                                            <td className="px-3 py-3">{row.itemId}</td>

                                            {(
                                                [
                                                    ['crate', row.crate],
                                                    ['kg', row.kg],
                                                    ['qty', row.qty],
                                                    ['rate', row.rate],
                                                    ['amount', row.amount],
                                                    ['discount', row.discount],
                                                    ['disamount', row.disamount],
                                                    ['taxableamt', row.taxableamt],
                                                    ['gstper', row.gstper],
                                                    ['sgstamt', row.sgstamt],
                                                    ['cgstamt', row.cgstamt],
                                                    ['igstamt', row.igstamt],
                                                ] as [keyof OrderItem, number][]
                                            ).map(([key, value]) => (
                                                <td key={key} className="px-2 py-2">
                                                    {[
                                                        'crate',
                                                        'kg',
                                                        'qty',
                                                        'rate',
                                                        'discount',
                                                    ].includes(key) ? (
                                                        <input
                                                            type="number"
                                                            className="w-24 rounded-md border border-line px-2 py-1.5 outline-none"
                                                            value={value}
                                                            onChange={(e) =>
                                                                updateRow(index, key, e.target.value)
                                                            }
                                                        />
                                                    ) : (
                                                        <span>{money(value).toFixed(2)}</span>
                                                    )}
                                                </td>
                                            ))}

                                            <td className="px-3 py-3">{row.narration}</td>

                                            <td className="px-3 py-3">
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        setRows((prev) =>
                                                            prev.filter((_, i) => i !== index),
                                                        )
                                                    }
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}

                                    {!rows.length && (
                                        <tr>
                                            <td
                                                colSpan={19}
                                                className="px-4 py-8 text-center text-mute"
                                            >
                                                No items added
                                            </td>
                                        </tr>
                                    )}
                                </tbody>

                                {rows.length > 0 && (
                                    <tfoot className="bg-slate-50 font-bold">
                                        <tr>
                                            <td colSpan={4} className="px-3 py-3">
                                                Total
                                            </td>
                                            <td className="px-3 py-3">{money(totals.crate)}</td>
                                            <td className="px-3 py-3">-</td>
                                            <td className="px-3 py-3">{money(totals.qty)}</td>
                                            <td className="px-3 py-3">{money(totals.rate)}</td>
                                            <td className="px-3 py-3">
                                                {money(totals.amount).toFixed(2)}
                                            </td>
                                            <td>-</td>
                                            <td className="px-3 py-3">
                                                {money(totals.discount).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-3">
                                                {money(totals.taxable).toFixed(2)}
                                            </td>
                                            <td colSpan={2} className="px-3 py-3">
                                                {money(totals.sgst).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-3">
                                                {money(totals.cgst).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-3">
                                                {money(totals.igst).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-3">
                                                {money(totals.total).toFixed(2)}
                                            </td>
                                            <td colSpan={2}></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </Card>
                </>
            )}

            {/* ================= APP VIEW ================= */}
            {view === 'app' && (
                <Card className="overflow-hidden">
                    <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
                        <h2 className="text-base font-bold">App Orders</h2>
                        <span className="ml-auto text-sm text-mute">
                            {appOrders.length} records
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-[#2B6CB0] text-white">
                                <tr>
                                    {[
                                        'Branch Id',
                                        'Branch Name',
                                        'Customer',
                                        'Order Master Id',
                                        'Order Id',
                                        'Item Amount',
                                        'Item Id',
                                        'Actions',
                                    ].map((header) => (
                                        <th
                                            key={header}
                                            className="whitespace-nowrap px-4 py-3 font-semibold"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {appOrders.map((order, index) => (
                                    <tr
                                        key={`${order.OrderId}-${index}`}
                                        className="border-b border-line"
                                    >
                                        <td className="px-4 py-3">{order.BranchId}</td>
                                        <td className="px-4 py-3">{order.BranchName}</td>
                                        <td className="px-4 py-3">
                                            {agencyName(order.AcCode)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.OrderMasterId}
                                        </td>
                                        <td className="px-4 py-3">{order.OrderId}</td>
                                        <td className="px-4 py-3">
                                            {money(order.ItemAmount).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3">{order.ItemId}</td>
                                        <td className="px-4 py-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => void editAppOrder(order)}
                                            >
                                                <Pencil size={14} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}

                                {!appOrders.length && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-8 text-center text-mute"
                                        >
                                            No records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* ================= DELETE MODAL ================= */}
            {deleteItem && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
                    <Card className="w-full max-w-md p-5">
                        <h2 className="text-lg font-bold">Confirm Delete</h2>

                        <p className="mt-3 text-sm text-mute">
                            Are you sure you want to delete Sales Order{' '}
                            <strong>{deleteItem.SalesNo}</strong>?
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