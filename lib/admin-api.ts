import { revalidateTag } from "next/cache";
import { STORE_TAG } from "@/lib/products-server";

export function revalidateStore(): void {
  revalidateTag(STORE_TAG);
}
