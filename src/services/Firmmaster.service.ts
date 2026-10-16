
const API_URL = "http://192.168.1.3:806";

export async function getFirmList() {
  const response = await fetch(
    `${API_URL}/api/Firm/Firmlist`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch firm list");
  }

  return await response.json();
}

export async function postFirmData(flag: number, data: any) {
  const response = await fetch(
    `${API_URL}/api/Firm/firm?flag=${flag}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save firm");
  }

  return await response.json();
}
