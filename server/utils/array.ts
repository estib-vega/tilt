/**
 * Group an array of items by a key.
 * @param array The array of items to group.
 * @param k The key function to group by.
 * @returns A map of items grouped by the key.
 */
export function groupBy<T, K extends string>(
  array: T[],
  k: (i: T) => K
): Map<K, T[]> {
  return array.reduce((map, item) => {
    const keyValue = k(item);
    const group = map.get(keyValue) ?? [];
    group.push(item);
    map.set(keyValue, group);
    return map;
  }, new Map<K, T[]>());
}
