/** Escape `<` so JSON-LD inside <script> cannot break out via `</script>`. */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
