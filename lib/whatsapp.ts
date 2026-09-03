import configData from "@/data/config.json";
import { qualifiesForFreeShipping } from "./first-order-discount";
import { formatPrice, formatPriceOrDm } from "./products";
import type { CartItem, Product, SellTradeFormData, StoreConfig } from "./types";

const defaultConfig = configData as StoreConfig;

export type WhatsAppCustomer = {
  displayName?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type WhatsAppOrderDiscount = {
  percent: number;
  amount: number;
};

export function generateOrderRef(): string {
  return `SS-${Date.now().toString(36).toUpperCase()}`;
}

export function buildWhatsAppUrl(
  message: string,
  cfg: StoreConfig = defaultConfig,
): string {
  return `https://api.whatsapp.com/send?phone=${cfg.contacts.whatsappPhone}&text=${encodeURIComponent(message)}`;
}

/** Digits only, Israel local 0X… → 972X…; returns null if too short. */
export function normalizeWhatsAppPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length >= 9) {
    digits = `972${digits.slice(1)}`;
  }
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export function buildAdminOrderReplyMessage(options: {
  orderRef: string;
  itemTitles: string[];
  customerName?: string | null;
}): string {
  const titles = options.itemTitles.filter(Boolean).slice(0, 5);
  const about =
    titles.length > 0
      ? titles.join(", ") + (options.itemTitles.length > 5 ? "…" : "")
      : "your order";
  const name = options.customerName?.trim();
  const greeting = name ? `Hi ${name}!` : "Hi!";
  return (
    `${greeting} Re order ${options.orderRef} about: ${about}. ` +
    `Happy to confirm availability and shipping.`
  );
}

export function buildAdminCustomerChatUrl(options: {
  phone: string | null | undefined;
  orderRef: string;
  itemTitles: string[];
  customerName?: string | null;
}): string | null {
  const digits = normalizeWhatsAppPhone(options.phone);
  if (!digits) return null;
  const message = buildAdminOrderReplyMessage(options);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function formatCustomerBlock(customer?: WhatsAppCustomer | null): string {
  if (!customer) return "";
  const lines: string[] = [];
  const name = customer.displayName?.trim();
  const phone = customer.phone?.trim();
  const email = customer.email?.trim();
  if (name) lines.push(`👤 Name: ${name}`);
  if (phone) lines.push(`📞 Phone: ${phone}`);
  if (email) lines.push(`✉️ Email: ${email}`);
  if (!lines.length) return "";
  return `\n${lines.join("\n")}\n`;
}

export function buildSingleItemMessage(
  product: Product,
  size: string | null,
  siteUrl: string,
  cfg: StoreConfig = defaultConfig,
  orderRef?: string,
  customer?: WhatsAppCustomer | null,
): string {
  const ref = orderRef || generateOrderRef();
  const sym = cfg.currency.symbol;
  const sizeLine = size ? `\n📐 Size: ${size}` : "";
  const productUrl = `${siteUrl}/product/${product.slug}`;

  return (
    `Hi ${cfg.contacts.managerName}! I want to order:\n\n` +
    `🆔 Order: ${ref}\n` +
    `🏷️ ${product.title}\n` +
    `🔢 SKU: #${product.id}${sizeLine}\n` +
    `💰 Price: ${formatPriceOrDm(product.price, sym)}\n` +
    `🔗 ${productUrl}` +
    formatCustomerBlock(customer) +
    `\nPlease confirm availability.`
  );
}

export function buildCartMessage(
  cartItems: CartItem[],
  products: Product[],
  siteUrl: string,
  cfg: StoreConfig = defaultConfig,
  orderRef?: string,
  customer?: WhatsAppCustomer | null,
  discount?: WhatsAppOrderDiscount | null,
): string {
  const sym = cfg.currency.symbol;
  const ref = orderRef || generateOrderRef();
  let subtotal = 0;
  let message = `Hi ${cfg.contacts.managerName}! I want to order:\n\n🆔 Order: ${ref}\n\n`;

  cartItems.forEach((item, index) => {
    const product = products.find((p) => p.id === item.id);
    if (!product) return;
    const lineTotal = product.price * item.quantity;
    subtotal += lineTotal;
    message += `${index + 1}. ${product.title}\n`;
    message += `   Size: ${item.size || "One Size"}\n`;
    message += `   ${product.price > 0 ? formatPrice(lineTotal, sym) : formatPriceOrDm(0, sym)}\n`;
    message += `   🔗 ${siteUrl}/product/${product.slug}\n\n`;
  });

  const discountAmount = Math.max(0, Number(discount?.amount ?? 0));
  const discountPercent = Math.max(0, Number(discount?.percent ?? 0));
  const total = Math.max(0, subtotal - discountAmount);

  message += `💰 Subtotal: ${subtotal > 0 ? formatPrice(subtotal, sym) : formatPriceOrDm(0, sym)}\n`;
  if (discountAmount > 0) {
    message += `🎁 First order ${discountPercent}% off: -${formatPrice(discountAmount, sym)}\n`;
    message += `💰 Total: ${total > 0 ? formatPrice(total, sym) : formatPriceOrDm(0, sym)}\n`;
  }
  if (qualifiesForFreeShipping(subtotal)) {
    message += `🚚 Free shipping (orders over ₪1000)\n`;
  } else {
    message += `🚚 Shipping: ₪25 locker / ₪50 door-to-door\n`;
  }
  message += formatCustomerBlock(customer);
  message += `\nPlease confirm availability.`;

  return message;
}

export function buildSellTradeMessage(
  data: SellTradeFormData,
  cfg: StoreConfig = defaultConfig,
): string {
  const ref = generateOrderRef();

  return (
    `Hi! I have an item for valuation/trade-in:\n\n` +
    `🆔 Ref: ${ref}\n` +
    `📦 Category: ${data.category}\n` +
    `🏷️ Brand & Model: ${data.name}\n` +
    `📐 Size: ${data.size}\n` +
    `✨ Condition: ${data.condition}\n` +
    `💰 Wanted Price: ${cfg.currency.symbol}${data.price}\n` +
    `📝 Notes: ${data.notes || "None"}\n\n` +
    `📸 Please send 4 photos: front, back, tag, box`
  );
}
