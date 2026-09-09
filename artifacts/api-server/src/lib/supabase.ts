type SupabaseRequestOptions = RequestInit & {
  prefer?: string;
};

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required.");
  }

  return { url, anonKey };
}

export async function supabaseRequest<T>(
  path: string,
  options: SupabaseRequestOptions = {},
): Promise<T> {
  const { url, anonKey } = getSupabaseConfig();
  const { prefer, headers: requestHeaders, ...requestInit } = options;
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...requestInit,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: "application/json",
      ...(requestInit.body ? { "Content-Type": "application/json" } : {}),
      ...(prefer ? { Prefer: prefer } : {}),
      ...requestHeaders,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${error.slice(0, 240)}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}