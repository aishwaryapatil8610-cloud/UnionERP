// import { decryptData } from './encryption.service';
// import { environment } from '../config/environment';

// export function readApiData(response: any): any {
//   const body = response?.data ?? response;

//   if (body && typeof body === 'object' && body.data != null) {
//     const encrypted = body.data;

//     if (typeof encrypted === 'string') {
//       const decrypted = decryptData(encrypted, environment.accessKey,);

//       console.log('Decrypted API Data:', decrypted);

//       try {
//         return JSON.parse(decrypted);
//       } catch {
//         return decrypted;
//       }
//     }

//     return encrypted;
//   }

//   if (typeof body === 'string') {
//     try {
//       return JSON.parse(body);
//     } catch {
//       return body;
//     }
//   }

//   return body;
// }



import { decryptData } from './encryption.service';
import { environment } from '../config/environment';

// Common API response decrypt / parse
export function readApiData(response: any): any {
  const body = response?.data ?? response;

  if (body && typeof body === 'object' && body.data != null) {
    const encrypted = body.data;

    if (typeof encrypted === 'string') {
      const decrypted = decryptData(
        encrypted,
        environment.accessKey,
      );

      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    }

    return encrypted;
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  return body;
}


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
      ...init?.headers,
      Accept: 'application/json',
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
  });

  const responseText = await response.text();

  let raw: any = null;

  try {
    raw = responseText ? JSON.parse(responseText) : null;
  } catch {
    raw = responseText;
  }

  if (!response.ok) {
    let message = 'Request failed';

    try {
      const parsed = readApiData({ data: raw });

      message =
        parsed?.message ||
        parsed?.Message ||
        parsed?.title ||
        message;
    } catch {
      message =
        raw?.message ||
        raw?.Message ||
        message;
    }

    throw new Error(`${response.status}: ${message}`);
  }

  if (raw?.success === false || raw?.Success === false) {
    throw new Error(
      raw?.message || raw?.Message || 'API request failed.',
    );
  }

  return readApiData({ data: raw });
}

// Get array from API response
function getArray(data: any): any[] {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.Data)) return data.Data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.Result)) return data.Result;

  return [];
}

// 1. Morning Weight List API
export async function getMorningWeightList(
  apiUrl: string,
  branchId: string,
  fromDate: string,
  toDate: string,
): Promise<any[]> {
  const url =
    `${apiUrl}/api/MorningWeight/MorningWeightlist` +
    `?branchId=${encodeURIComponent(branchId)}` +
    `&fromDate=${encodeURIComponent(fromDate)}` +
    `&toDate=${encodeURIComponent(toDate)}`;

  const data = await requestData(url);
  return getArray(data);
}

// 2. Account API: MCC, Route, Farmer
export async function getMorningWeightAccounts(
  apiUrl: string,
): Promise<any[]> {
  const url =
    `${apiUrl}/api/Account/AccounType?AccountType=F`;

  const data = await requestData(url);
  return getArray(data);
}

// 3. Save / Update Morning Weight API
export async function saveMorningWeight(
  apiUrl: string,
  payload: any,
  editCode: number,
): Promise<any> {
  const url =
    `${apiUrl}/api/MorningWeight/MorningWeight` +
    `?flag=${editCode ? 1 : 0}`;

  return requestData(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

// 4. Delete Morning Weight API
export async function deleteMorningWeight(
  apiUrl: string,
  codeNo: number,
): Promise<any> {
  const url =
    `${apiUrl}/api/MorningWeight/delete/${codeNo}`;

  return requestData(url, {
    method: 'DELETE',
  });
}
