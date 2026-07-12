import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { isAllowedImageMime, MAX_UPLOAD_BYTES, optimizeImage } from "@/lib/image-optimize";
import { uploadToStorage } from "@/lib/supabase-storage";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const entries = [
    ...formData.getAll("files"),
    ...formData.getAll("file"),
  ].filter((f): f is File => f instanceof File);

  if (!entries.length) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  const urls: string[] = [];

  for (const file of entries) {
    if (!isAllowedImageMime(file.type)) {
      return NextResponse.json({ error: `Invalid type: ${file.type}` }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const raw = Buffer.from(await file.arrayBuffer());
    const { buffer, contentType, ext } = await optimizeImage(raw, file.type);
    const url = await uploadToStorage(buffer, contentType, ext);
    urls.push(url);
  }

  return NextResponse.json({ urls, url: urls[0] });
}
