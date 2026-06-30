declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", eventName, params);
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

export function trackThemeToggle(theme: string): void {
  trackEvent("theme_toggle", { theme });
}

export function trackFaqExpand(question: string): void {
  trackEvent("faq_expand", { question });
}
