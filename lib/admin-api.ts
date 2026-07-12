import { revalidatePath, revalidateTag } from "next/cache";
import { STORE_TAG } from "@/lib/products-server";

const REVALIDATE_PATHS = ["/", "/drops", "/brand-new", "/made-to-order", "/brands"];

export function revalidateStore(): void {
  revalidateTag(STORE_TAG);
  revalidatePath("/", "layout");
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}
