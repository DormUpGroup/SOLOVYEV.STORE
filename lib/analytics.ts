declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const pendingEvents: Array<{ type: string; productId?: number }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flushAnalytics(): void {
  if (typeof window === "undefined" || pendingEvents.length === 0) return;
  const batch = pendingEvents.splice(0, pendingEvents.length);
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events: batch }),
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => {});
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;

  if (window.gtag) {
    window.gtag("event", eventName, params);
  }

  const productId =
    params?.item_id != null ? Number(params.item_id) : undefined;
  if (
    eventName === "view_item" ||
    eventName === "add_to_cart" ||
    eventName === "begin_checkout" ||
    eventName === "sell_trade_submit"
  ) {
    pendingEvents.push({
      type: eventName,
      productId: Number.isFinite(productId) ? productId : undefined,
    });
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flushAnalytics, 1500);
  }
}

export function trackViewItem(product: {
  id: number;
  title: string;
  price: number;
  brand: string;
  category: string;
}): void {
  trackEvent("view_item", {
    currency: "ILS",
    value: product.price,
    items: 1,
    item_id: String(product.id),
    item_name: product.title,
    item_brand: product.brand,
    item_category: product.category,
  });
}

export function trackAddToCart(product: {
  id: number;
  title: string;
  price: number;
  size: string;
}): void {
  trackEvent("add_to_cart", {
    currency: "ILS",
    value: product.price,
    item_id: String(product.id),
    item_name: product.title,
    size: product.size,
  });
}

export function trackBeginCheckout(value: number, itemCount: number): void {
  trackEvent("begin_checkout", {
    currency: "ILS",
    value,
    items: itemCount,
  });
}

export function trackSellTradeSubmit(): void {
  trackEvent("sell_trade_submit");
}

export function trackFilterApply(filterType: string, value: string): void {
  trackEvent("filter_apply", { filter_type: filterType, filter_value: value });
}

export function trackFaqExpand(question: string): void {
  trackEvent("faq_expand", { question });
}
