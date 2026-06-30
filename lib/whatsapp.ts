import { config, formatPrice, formatPriceOrDm } from "./products";
import type { CartItem, Product, SellTradeFormData } from "./types";

export function generateOrderRef(): string {
  return `SS-${Date.now().toString(36).toUpperCase()}`;
}

export function buildWhatsAppUrl(message: string): string {
  return `https://api.whatsapp.com/send?phone=${config.contacts.whatsappPhone}&text=${encodeURIComponent(message)}`;
}

export function buildSingleItemMessage(
  product: Product,
  size: string | null,
  siteUrl: string,
): string {
  const ref = generateOrderRef();
  const sizeLine = size ? `\n📐 Size: ${size}` : "";
  const productUrl = `${siteUrl}/product/${product.slug}`;

  return (
    `Hi ${config.contacts.managerName}! I want to order:\n\n` +
    `🆔 Order: ${ref}\n` +
    `🏷️ ${product.title}\n` +
    `🔢 SKU: #${product.id}${sizeLine}\n` +
    `💰 Price: ${formatPriceOrDm(product.price)}\n` +
    `🔗 ${productUrl}\n\n` +
    `Please confirm availability.`
  );
}

export function buildCartMessage(
  cartItems: CartItem[],
  products: Product[],
  siteUrl: string,
): string {
  const ref = generateOrderRef();
  let subtotal = 0;
  let message = `Hi ${config.contacts.managerName}! I want to order:\n\n🆔 Order: ${ref}\n\n`;

  cartItems.forEach((item, index) => {
    const product = products.find((p) => p.id === item.id);
    if (!product) return;
    const lineTotal = product.price * item.quantity;
    subtotal += lineTotal;
    message += `${index + 1}. ${product.title}\n`;
    message += `   Size: ${item.size || "One Size"}\n`;
    message += `   ${formatPriceOrDm(product.price)} × ${item.quantity} = ${product.price > 0 ? formatPrice(lineTotal) : formatPriceOrDm(0)}\n`;
    message += `   🔗 ${siteUrl}/product/${product.slug}\n\n`;
  });

  message += `💰 Subtotal: ${subtotal > 0 ? formatPrice(subtotal) : formatPriceOrDm(0)}\n`;
  if (subtotal >= 1000) {
    message += `🚚 Free shipping (orders over ₪1000)\n`;
  } else {
    message += `🚚 Shipping: ₪25 locker / ₪50 door-to-door\n`;
  }
  message += `\nPlease confirm availability.`;

  return message;
}

export function buildSellTradeMessage(data: SellTradeFormData): string {
  const ref = generateOrderRef();

  return (
    `Hi! I have an item for valuation/trade-in:\n\n` +
    `🆔 Ref: ${ref}\n` +
    `📦 Category: ${data.category}\n` +
    `🏷️ Brand & Model: ${data.name}\n` +
    `📐 Size: ${data.size}\n` +
    `✨ Condition: ${data.condition}\n` +
    `💰 Wanted Price: ${config.currency.symbol}${data.price}\n` +
    `📝 Notes: ${data.notes || "None"}\n\n` +
    `📸 Please send 4 photos: front, back, tag, box`
  );
}
