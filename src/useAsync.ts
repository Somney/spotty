import { useCallback, useEffect, useRef, useState } from 'react';
import { Loadable } from './components/Shelf';

/** Runs `fn` whenever `key` changes; ignores results from superseded runs. */
export function useAsync<T>(fn: () => Promise<T>, key: string): Loadable<T> {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null,
  });
  const [nonce, setNonce] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let live = true;
    setState({ data: null, loading: true, error: null });
    fnRef
      .current()
      .then((data) => live && setState({ data, loading: false, error: null }))
      .catch((e) => live && setState({ data: null, loading: false, error: e?.message ?? 'Something went wrong' }));
    return () => {
      live = false;
    };
  }, [key, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}
