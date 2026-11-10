const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 5 * 60 * 1000;

export async function getJson<T>(url: string, timeoutMs = 15000): Promise<T> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL) return hit.data as T;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const data = (await res.json()) as T;
    cache.set(url, { at: Date.now(), data });
    return data;
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error('The request timed out');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
