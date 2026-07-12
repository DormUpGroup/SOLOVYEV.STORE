import { getSupabaseAdmin } from "@/lib/supabase";

export const PRODUCT_BUCKET = "product-images";

export function parseSupabaseStorageUrl(
  url: string,
): { bucket: string; path: string } | null {
  try {
    const parsed = new URL(url);
    const marker = "/storage/v1/object/public/";
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    const rest = parsed.pathname.slice(idx + marker.length);
    const slash = rest.indexOf("/");
    if (slash === -1) return null;
    return {
      bucket: rest.slice(0, slash),
      path: decodeURIComponent(rest.slice(slash + 1)),
    };
  } catch {
    return null;
  }
}

export async function uploadToStorage(
  buffer: Buffer,
  contentType: string,
  ext: string,
  bucket = PRODUCT_BUCKET,
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteStorageUrl(url: string): Promise<void> {
  const parsed = parseSupabaseStorageUrl(url);
  if (!parsed) return;
  const supabase = getSupabaseAdmin();
  await supabase.storage.from(parsed.bucket).remove([parsed.path]);
}

export async function deleteStorageUrls(urls: string[]): Promise<void> {
  await Promise.allSettled(urls.map((url) => deleteStorageUrl(url)));
}

export async function deleteCloudinaryUrl(url: string): Promise<void> {
  if (!url.includes("cloudinary.com")) return;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return;

  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
  if (!match?.[1]) return;
  const publicId = match[1];

  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-1", encoder.encode(toSign));
  const signature = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
  });

  await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body,
  }).catch(() => undefined);
}

export async function deleteImageUrl(url: string): Promise<void> {
  await Promise.allSettled([deleteStorageUrl(url), deleteCloudinaryUrl(url)]);
}
