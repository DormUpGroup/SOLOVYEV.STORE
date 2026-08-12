import {
  isRotateDegrees,
  rotateOptimizedImage,
  type RotateDegrees,
} from "@/lib/image-optimize";
import { deleteImageUrl, uploadToStorage } from "@/lib/supabase-storage";

export { isRotateDegrees, type RotateDegrees };

export async function rotateImageAtUrl(
  imageUrl: string,
  degrees: RotateDegrees,
): Promise<string> {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error("Failed to download image");
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const { buffer: rotated, contentType, ext } = await rotateOptimizedImage(buffer, degrees);
  const newUrl = await uploadToStorage(rotated, contentType, ext);
  void deleteImageUrl(imageUrl);
  return newUrl;
}
