
import { readApiData } from './morningWeight.service';

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
            // Original API error message use hoil.
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

  }
}

// console.log('After readApiData:', parsed);
// console.log('Is parsed an array:', Array.isArray(parsed));
// console.log('Parsed length:', Array.isArray(parsed) ? parsed.length : 'Not an array');

return parsed;


}


export function getRMRDList(
    apiUrl: string,
    branchId: string,
    milkType: string,
    shift: string,
    trDate: string,
) {
    console.log('RMRD trDate:', trDate);

    const params = new URLSearchParams({
        branchId,
        milkType,
        shift,
        trDate,
    });

    console.log('RMRD API URL:', `${apiUrl}/api/BillDetails/BillDetailslistforpending?${params}`);


    return requestData(
        `${apiUrl}/api/BillDetails/BillDetailslistforpending?${params}`,
    ).then((data) => {
        // console.log('RMRD API Response:', data);
        return data;
    });

}


export function saveRMRD(
    apiUrl: string,
    flag: number,
    payload: any[],
) {
    return requestData(
        `${apiUrl}/api/BillDetails/BillDetails?flag=${flag}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        },
    );
}
