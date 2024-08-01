type AsyncBytesIterator = AsyncGenerator<string, void, unknown>;

export async function* readerToStringIterator(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncBytesIterator {
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      yield new TextDecoder().decode(value);
    }
  } finally {
    reader.releaseLock();
  }
}
