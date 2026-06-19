import { BASE_URL } from "./api";

function getHeaders() {
  const token = localStorage.getItem("accessToken");
  let userId = null;
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    userId = user?.id || user?.userId || user?.user_id;
  } catch {}

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(userId ? { "X-User-Id": userId } : {}),
  };
}

function parseAccountsFromBrokenJson(text) {
  const accounts = [];
  const seen = new Set();

  const idMatches = [...text.matchAll(/"id"\s*:\s*"([0-9a-f-]{36})"/g)];
  const ids = [...new Set(idMatches.map((m) => m[1]))];

  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);

    const idPos = text.indexOf(`"id":"${id}"`);
    if (idPos === -1) continue;

    const searchRegion = text.slice(Math.max(0, idPos - 500), idPos + 500);

    const fullName = searchRegion.match(/"fullName"\s*:\s*"([^"]*)"/)?.[1];
    const accountStatus = searchRegion.match(/"accountStatus"\s*:\s*"([^"]*)"/)?.[1];
    const createdAt = searchRegion.match(/"createdAt"\s*:\s*"([^"]*)"/)?.[1];
    const email = searchRegion.match(/"email"\s*:\s*"([^"]*)"/)?.[1];
    const role = searchRegion.match(/"role"\s*:\s*"([^"]*)"/)?.[1];

    accounts.push({
      id,
      fullName: fullName || null,
      accountStatus: accountStatus || "ACTIVE",
      createdAt: createdAt || null,
      email: email || null,
      role: role || null,
    });
  }

  return accounts;
}

export async function getUsers() {
  const response = await fetch(`${BASE_URL}/admin/account`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw { message: "API request failed", status: response.status };
  }

  const text = await response.text();

  try {
    const data = JSON.parse(text);
    const list = data?.data || data;
    if (Array.isArray(list)) return list;
  } catch {
    console.warn("Admin accounts JSON invalid, using fallback parser");
  }

  return parseAccountsFromBrokenJson(text);
}
