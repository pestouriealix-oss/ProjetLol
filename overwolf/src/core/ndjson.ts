/** Lit un flux NDJSON (une valeur JSON par ligne), ligne après ligne. */
export async function* readNdjson(body: ReadableStream<Uint8Array>): AsyncGenerator<unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    let newline = buffer.indexOf("\n");
    while (newline >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) yield JSON.parse(line) as unknown;
      newline = buffer.indexOf("\n");
    }
    if (done) break;
  }
  const rest = buffer.trim();
  if (rest) yield JSON.parse(rest) as unknown;
}
