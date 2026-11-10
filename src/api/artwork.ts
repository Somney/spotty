import { useEffect, useState } from 'react';
import { getJson } from './http';

// Looks up a photo of an artist on Wikipedia, for recordings that come with no cover of their own.
const done = new Map<string, string | null>();
const pending = new Map<string, Promise<string | null>>();

const SKIP = /^(unknown|various|v\.?a\.?|live recording|anonymous)/i;

async function pageImage(title: string): Promise<string | null> {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1' +
    '&prop=pageimages%7Cpageprops&piprop=thumbnail&pithumbsize=500&ppprop=disambiguation' +
    `&titles=${encodeURIComponent(title)}`;
  const r = await getJson<{ query?: { pages?: Record<string, any> } }>(url, 8000);
  const page = Object.values(r.query?.pages ?? {})[0];
  // A disambiguation page means the name is too generic to trust.
  if (!page || page.missing !== undefined || page.pageprops?.disambiguation !== undefined) return null;
  return page.thumbnail?.source ?? null;
}

export function artistImage(name: string): Promise<string | null> {
  const key = name.trim();
  if (key.length < 3 || SKIP.test(key)) return Promise.resolve(null);
  if (done.has(key)) return Promise.resolve(done.get(key)!);
  let p = pending.get(key);
  if (!p) {
    // "Paul Whiteman and George Gershwin" has no page of its own; fall back to the first name.
    const lead = key.split(/,|;|&| and | with | feat\.? /i)[0].trim();
    p = pageImage(key)
      .then((img) => img ?? (lead !== key && lead.length >= 3 ? pageImage(lead) : null))
      .catch(() => null)
      .then((img) => {
        done.set(key, img);
        pending.delete(key);
        return img;
      });
    pending.set(key, p);
  }
  return p;
}

export function useArtistImage(name: string | undefined, enabled: boolean): string | undefined {
  const [uri, setUri] = useState<string | undefined>(() => (name && done.get(name.trim())) || undefined);
  useEffect(() => {
    if (!enabled || !name) return;
    let live = true;
    artistImage(name).then((img) => live && setUri(img ?? undefined));
    return () => {
      live = false;
    };
  }, [name, enabled]);
  return enabled ? uri : undefined;
}
