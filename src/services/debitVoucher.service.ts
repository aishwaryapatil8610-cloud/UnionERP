
import { readApiData } from './morningWeight.service';
import { environment } from '../config/environment';

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
        throw new Error(
            raw?.message || raw?.Message || `Request failed: ${response.status}`,
        );
    }

    if (raw?.success === false || raw?.Success === false) {
        throw new Error(raw?.message || raw?.Message || 'API request failed');
    }

    return readApiData({ data: raw });
}

const apiUrl = environment.staticIP1;

export function getVoucherList(
    branchId: string,
    fromDate: string,
    toDate: string,
) {
    return requestData(
        `${apiUrl}/api/PaymentVoucher/PaymentVoucherlist` +
        `?branchId=${encodeURIComponent(branchId)}` +
        `&fromDate=${encodeURIComponent(fromDate)}` +
        `&toDate=${encodeURIComponent(toDate)}`,
    );
}

export function getVoucherById(id: number) {
    return requestData(`${apiUrl}/api/PaymentVoucher/GetById/${id}`);
}

export function saveVoucher(flag: number, payload: any) {
    return requestData(
        `${apiUrl}/api/PaymentVoucher/PaymentVoucher?flag=${flag}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        },
    );
}

export function deleteVoucher(id: number) {
    return requestData(`${apiUrl}/api/PaymentVoucher/delete/${id}`, {
        method: 'DELETE',
    });
}

export function getVoucherAccounts(accountType: string) {
    return requestData(
        `${apiUrl}/api/Account/AccounType?AccountType=${encodeURIComponent(accountType)}`,
    );
}

export function getDeductionTypes(branchId: string) {
    return requestData(
        `${apiUrl}/api/DeductionMaster/DeductionMasterlist` +
        `?branchId=${encodeURIComponent(branchId)}`,
    );
}
