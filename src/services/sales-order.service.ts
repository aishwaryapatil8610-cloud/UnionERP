
import { readApiData } from './morningWeight.service';

async function requestData(url: string, init?: RequestInit): Promise<any> {
    const token =
        localStorage.getItem('accessToken') ||
        localStorage.getItem('token');

    const response = await fetch(url, {
        ...init,
        headers: {
            Accept: 'application/json',
            ...init?.headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    const text = await response.text();

    let raw: any = null;

    try {
        raw = text ? JSON.parse(text) : null;
    } catch {
        raw = text;
    }

    if (!response.ok) {
        let message = raw?.message || raw?.Message || 'Request failed';

        try {
            const parsed = readApiData({ data: raw });
            message = parsed?.message || parsed?.Message || message;
        } catch {
        }

        throw new Error(`${response.status}: ${message}`);
    }

    if (raw?.success === false || raw?.Success === false) {
        throw new Error(raw?.message || raw?.Message || 'API request failed');
    }

    return readApiData({ data: raw });
}


export async function getSalesOrderList(
     apiUrl: string,
    branchId: string,
    fromDate: string,
    toDate: string,
) {
    const url =
        `${apiUrl}/api/SaleOrder/GetBySaleOrders` +
        `?branchId=${encodeURIComponent(branchId)}` +
        `&fromDate=${encodeURIComponent(fromDate)}` +
        `&toDate=${encodeURIComponent(toDate)}`;

    const response = await requestData(url);

    console.log('Sales Order API Response:', response);

    return response;
}

export function getSalesOrderById( apiUrl: string,id: number | string) {
    return requestData(`${apiUrl}/api/SaleOrder/GetBySaleOrderId/${id}`);
}

export function getAppOrderList( apiUrl: string,branchId: string) {
    return requestData(
        `${apiUrl}/api/SaleOrder/AppOrderList?branchId=${encodeURIComponent(branchId)}`,
    );
}

export function getAppOrderById( apiUrl: string,id: number | string) {
    return requestData(`${apiUrl}/api/SaleOrder/GetById/${id}`);
}

export function saveSalesOrder( apiUrl: string,flag: number, payload: any) {
    return requestData(`${apiUrl}/api/SaleOrder?flag=${flag}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

export function deleteSalesOrder( apiUrl: string,id: number | string) {
    return requestData(`${apiUrl}/api/SaleOrder/delete/${id}`, {
        method: 'DELETE',
    });
}

export function getBranchList( apiUrl: string,) {
    return requestData(`${apiUrl}/api/Branch/Branchlist`);
}

export function getAccountList( apiUrl: string,accountType: string) {
    return requestData(
        `${apiUrl}/api/Account/AccounType?AccountType=${encodeURIComponent(accountType)}`,
    );
}

export function getCategoryList( apiUrl: string,firmId: string) {
    return requestData(
        `${apiUrl}/api/StoreItemMaster/Items?firmId=${encodeURIComponent(firmId)}`,
    );
}