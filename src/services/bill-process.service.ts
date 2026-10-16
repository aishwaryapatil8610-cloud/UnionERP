import { environment } from '../config/environment';
import { readApiData } from './morningWeight.service';

const API_URL = environment.staticIP1;

async function requestData(
    url: string,
    init?: RequestInit,
): Promise<any> {
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

    // HTTP error handling
    if (!response.ok) {
        let message =
            raw?.message || raw?.Message || 'Request failed';

        try {
            const parsed = readApiData({ data: raw });
            message =
                parsed?.message || parsed?.Message || message;
        } catch {
            // Original API error message use hoil.
        }

        throw new Error(`${response.status}: ${message}`);
    }

    // API-level error handling
    if (raw?.success === false || raw?.Success === false) {
        throw new Error(
            raw?.message || raw?.Message || 'API request failed',
        );
    }

    // Decrypt / parse API response
    let parsed = readApiData({ data: raw });

    if (typeof parsed === 'string') {
        try {
            parsed = JSON.parse(parsed);
        } catch {
            // String response asel tar tasach return hoil.
        }
    }

    return parsed;
}

export const billProcessService = {
    getBillCycles(branchId: string) {
        const params = new URLSearchParams({ branchId });

        console.log(
            'Bill Cycle API URL:',
            `${API_URL}/api/BillCycle/BillCyclelist?${params}`,
        );

        return requestData(
            `${API_URL}/api/BillCycle/BillCyclelist?${params}`,
        );
    },

    getPendingList(
        branchId: string,
        fromDate: string,
        toDate: string,
    ) {
        const params = new URLSearchParams({
            branchId,
            fromDate,
            toDate,
        });

        console.log(
            'Bill Process API URL:',
            `${API_URL}/api/FarmerBillProcess/FarmerBillProcesslist?${params}`,
        );

        return requestData(
            `${API_URL}/api/FarmerBillProcess/FarmerBillProcesslist?${params}`,
        );
    },

    saveBillProcess(payload: unknown) {
        return requestData(
            `${API_URL}/api/FarmerBillProcess/FarmerBillProcess`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            },
        );
    },

    deleteBillProcess(processId: number) {
        return requestData(
            `${API_URL}/api/FarmerBillProcess/delete/${processId}`,
            {
                method: 'DELETE',
            },
        );
    },

    getFarmerBillReport(
        branchId: string,
        processId: number,
        fromDate: string,
        toDate: string,
    ) {
        const params = new URLSearchParams({
            branchId,
            processId: String(processId),
            fromDate,
            toDate,
        });

        console.log(
            'Farmer Bill Report API URL:',
            `${API_URL}/api/FarmerBillProcess/FarmerBillReport?${params}`,
        );

        return requestData(
            `${API_URL}/api/FarmerBillProcess/FarmerBillReport?${params}`,
        );
    },
};
