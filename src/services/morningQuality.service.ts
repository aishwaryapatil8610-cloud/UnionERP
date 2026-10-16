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
    let message =
      raw?.message || raw?.Message || 'Request failed';

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

export function getPendingQualityList(apiUrl: string, branchId: string, fromDate: string, toDate: string,) {
  const url = `${apiUrl}/api/MorningWeight/MorningWeightlistforpending` + `?branchId=${encodeURIComponent(branchId)}` + `&fromDate=${encodeURIComponent(fromDate)}` + `&toDate=${encodeURIComponent(toDate)}`;
  return requestData(url);
}

export function getSavedQualityList(
  apiUrl: string,
  branchId: string,
  fromDate: string,
  toDate: string,
) {
  const url =
    `${apiUrl}/api/MorningQuality/MorningQualitylist` +
    `?branchId=${encodeURIComponent(branchId)}` +
    `&fromDate=${encodeURIComponent(fromDate)}` +
    `&toDate=${encodeURIComponent(toDate)}`;

  return requestData(url);
}

export function getPendingQualityById(apiUrl: string, id: number) {
  return requestData(`${apiUrl}/api/MorningWeight/GetById/${id}`);
}

export function getQualityById(apiUrl: string, id: number) {
  return requestData(`${apiUrl}/api/MorningQuality/GetById/${id}`);
}

export function saveMorningQuality(
  apiUrl: string,
  flag: number,
  payload: any,
) {
  return requestData(
    `${apiUrl}/api/MorningQuality/MorningQuality?flag=${flag}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
}

export function deleteMorningQuality(apiUrl: string, id: number) {
  return requestData(`${apiUrl}/api/MorningQuality/delete/${id}`, {
    method: 'DELETE',
  });
}

export function getQualityAccounts(apiUrl: string) {
  return requestData(
    `${apiUrl}/api/Account/AccounType?AccountType=F`,
  );
}
