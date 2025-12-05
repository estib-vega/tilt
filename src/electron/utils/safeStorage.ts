import { safeStorage } from 'electron';

export function encryptString(plainText: string): Buffer<ArrayBufferLike> {
  return safeStorage.encryptString(plainText);
}

export function decryptString(encrypted: Buffer<ArrayBufferLike>): string {
  return safeStorage.decryptString(encrypted);
}
