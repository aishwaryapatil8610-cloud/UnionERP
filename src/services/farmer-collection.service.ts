
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

    if (!response.ok) {
        let message =
            raw?.message || raw?.Message || 'Request failed';

        try {
            const parsed = readApiData({ data: raw });
            message =
                parsed?.message || parsed?.Message || message;
        } catch {
            // Original API error message वापरू.
        }

        throw new Error(`${response.status}: ${message}`);
    }

    if (raw?.success === false || raw?.Success === false) {
        throw new Error(
            raw?.message || raw?.Message || 'API request failed',
        );
    }

    let parsed = readApiData({ data: raw });

    if (typeof parsed === 'string') {
        try {
            parsed = JSON.parse(parsed);
        } catch {
            // String response असल्यास तसाच return होईल.
        }
    }

    return parsed;
}

export const farmerCollectionService = {
    getBranchList(accountType = 'F') {
        const params = new URLSearchParams({ AccountType: accountType });

        return requestData(
            `${API_URL}/api/Account/AccounType?${params}`,
        );
    },

    getReportAccess(branchId: string, reportId = 1) {
        const params = new URLSearchParams({
            branchId,
            reportId: String(reportId),
        });

        return requestData(
            `${API_URL}/api/User/ReportConfiguration?${params}`,
        );
    },

    getFarmerCollectionList(
        branchId: string,
        routeId: string,
        farmerId: string,
        milkType: string,
        shift: string,
        fromDate: string,
        toDate: string,
    ) {
        const params = new URLSearchParams({
            branchId,
            routeId,
            farmerId,
            milkType,
            shift,
            fromDate,
            toDate,
        });

        return requestData(
            `${API_URL}/api/BillDetails/FarmerCollection?${params}`,
        );
    },
};
