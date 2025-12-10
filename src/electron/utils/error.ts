export function isError(something: unknown): something is Error {
  return something instanceof Error;
}

export function isConnectionRefusedError(error: unknown): boolean {
  if (isError(error)) {
    return (error as any).code === 'ECONNREFUSED' || (error.cause as any)?.code === 'ECONNREFUSED';
  }
  return false;
}
