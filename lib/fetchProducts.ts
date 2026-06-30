/**
 * Phase 2: Google Sheets integration hook.
 *
 * Sheet columns → Product fields:
 * id | slug | title | category | price | original_price | condition | brand | badge | sizes (comma-separated) | image_url | status
 *
 * Usage at build time:
 *   const products = await fetchProductsFromSheet(process.env.SHEETS_JSON_URL);
 */

import type { Product } from "./types";

export async function fetchProductsFromSheet(url: string): Promise<Product[]> {
  const response = await fetch(url, { next: { revalidate: 300 } });
  if (!response.ok) {
    throw new Error(`Failed to fetch products from sheet: ${response.status}`);
  }
  return response.json() as Promise<Product[]>;
}
