import { useEffect, useState } from 'react';
import { SEARCH_DEBOUNCE_MS } from '@config/constants';

/**
 * Debounces a value by `delay` ms.
 * Useful for search inputs to avoid hammering the API on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number = SEARCH_DEBOUNCE_MS): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
