export function safeParseJson<T = unknown>(s: string | null): T | null {
  if (s == null) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return s as any;
  }
}

export type JSONValue = string | boolean | number | null | JSONArray | JSONObject;

export type JSONArray = JSONValue[];

export interface JSONObject {
  [key: string]: JSONValue;
}

export function safeStringifyJson(value: JSONValue): string {
  return JSON.stringify(value);
}
