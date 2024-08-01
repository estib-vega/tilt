export type UnknownObject = Record<string, unknown>;

export function isUnknownObject(value: unknown): value is UnknownObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
