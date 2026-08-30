import { parseClothingType, type ClothingType } from "@/lib/clothing-types";
import type { ProductCategory } from "@/lib/types";

export function parseProductCategory(param: string | null): "all" | ProductCategory {
  if (param === "sneakers" || param === "clothing" || param === "accessories") {
    return param;
  }
  return "all";
}

export function buildCatalogUrl(
  path: string,
  category: "all" | ProductCategory,
  clothingType: "" | ClothingType = "",
): string {
  const params = new URLSearchParams();
  if (category !== "all") params.set("category", category);
  if (category === "clothing" && clothingType) params.set("type", clothingType);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export { parseClothingType };
