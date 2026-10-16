
const API_URL = "http://192.168.1.3:806";

// Get Branch List
export async function getBranchList() {
  const response = await fetch(
    `${API_URL}/api/Branch/Branchlist`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch branch list");
  }

  return await response.json();
}


export async function postBranchData(flag: number, data: any) {
  const response = await fetch(
    `${API_URL}/api/Branch/branch?flag=${flag}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save branch");
  }

  return await response.json();
}
