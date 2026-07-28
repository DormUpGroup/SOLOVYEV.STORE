export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidPassword(value: string): boolean {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
}

export function safeAuthNext(value: string | null, fallback = "/account"): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
