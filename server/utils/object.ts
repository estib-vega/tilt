/**
 * Returns an array of key-value pairs from the given object.
 *
 * @param obj The object to extract key-value pairs from.
 * @returns An array of key-value pairs.
 */
export function entries<T extends Record<string, unknown>, K extends keyof T>(
  obj: T
): [K, T[K]][] {
  return Object.entries(obj) as [K, T[K]][];
}

/**
 * Returns a new object with the specified keys omitted.
 *
 * @param obj The object to omit keys from.
 * @param keys The keys to omit.
 * @returns A new object with the specified keys omitted.
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result: Partial<T> = {};
  const e = entries<T, K>(obj);
  for (const [key, value] of e) {
    if (!keys.includes(key)) {
      result[key] = value;
    }
  }
  return result as Omit<T, K>;
}
