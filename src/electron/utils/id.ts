export type BrandedID<T extends string> = string & { __brand: T };

export function createBrandedID<T extends string>(_: T, id: string): BrandedID<T> {
  return id as BrandedID<T>;
}
