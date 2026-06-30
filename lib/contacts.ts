import { config } from "./products";

export function formatDisplayPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("972") && digits.length >= 11) {
    const local = digits.slice(3);
    return `+972 ${local.slice(0, 2)}-${local.slice(2, 5)}-${local.slice(5)}`;
  }
  return digits ? `+${digits}` : phone;
}

export function buildMapEmbedUrl(lat: number, lng: number, padding = 0.04): string {
  const bbox = [lng - padding, lat - padding, lng + padding, lat + padding].join(
    ",",
  );
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export function buildMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function getStoreLocationLabel(): string {
  const { city, country } = config.location;
  return country ? `${city}, ${country}` : city;
}
