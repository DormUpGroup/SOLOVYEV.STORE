export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidPassword(value: string): boolean {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
}

export function safeAuthNext(value: string | null, fallback = "/account"): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function buildAuthQuery(params: {
  next?: string | null;
  checkout?: boolean;
}): string {
  const search = new URLSearchParams();
  const next = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "";
  if (next) search.set("next", next);
  if (params.checkout) search.set("checkout", "1");
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function isCheckoutIntent(value: string | null): boolean {
  return value === "1" || value === "true";
}

export function postAuthPath(options: {
  hasDisplayName: boolean;
  checkout: boolean;
  next?: string | null;
}): string {
  const query = buildAuthQuery({ next: options.next, checkout: options.checkout });
  if (!options.hasDisplayName) return `/onboarding${query}`;
  if (options.checkout) return `/welcome${query}`;
  return safeAuthNext(options.next ?? null);
}

export function checkoutLoginHref(pathname: string): string {
  return `/login${buildAuthQuery({ next: pathname, checkout: true })}`;
}
