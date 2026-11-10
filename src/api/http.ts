const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 5 * 60 * 1000;

async function once<T>(url: string, timeoutMs: number): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return (await res.json()) as T;
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error('The request timed out');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export async function getJson<T>(url: string, timeoutMs = 15000): Promise<T> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL) return hit.data as T;

  let data: T;
  try {
    data = await once<T>(url, timeoutMs);
  } catch (e: any) {
    // A dropped connection is worth one more try; an HTTP error or timeout is not.
    if (/Request failed|timed out/.test(e?.message ?? '')) throw e;
    await new Promise((r) => setTimeout(r, 600));
    try {
      data = await once<T>(url, timeoutMs);
    } catch {
      throw new Error('No connection to this source');
    }
  }
  cache.set(url, { at: Date.now(), data });
  return data;
}
