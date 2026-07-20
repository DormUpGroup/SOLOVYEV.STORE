import { revalidatePath, revalidateTag } from "next/cache";
import { STORE_TAG } from "@/lib/products-server";

const REVALIDATE_PATHS = [
  "/",
  "/drops",
  "/brand-new",
  "/made-to-order",
  "/brands",
  "/faq",
  "/about",
  "/sell-trade",
];

export function revalidateStore(productSlug?: string): void {
  try {
    revalidateTag(STORE_TAG);
    revalidatePath("/", "layout");
    revalidatePath("/product", "layout");
    for (const path of REVALIDATE_PATHS) {
      revalidatePath(path);
    }
    if (productSlug) {
      revalidatePath(`/product/${productSlug}`);
    }
  } catch (err) {
    // Never turn a successful mutation into a 500 because cache invalidation failed
    console.warn("[revalidateStore] non-fatal:", err);
  }
}
