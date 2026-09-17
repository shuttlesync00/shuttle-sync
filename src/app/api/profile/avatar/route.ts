import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const BUCKET_NAME = "avatars";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to upload a profile photo." }, { status: 401 });
  }

  const formData = await request.formData();
  const fileValue = formData.get("file");
  if (!(fileValue instanceof File)) {
    return NextResponse.json({ error: "Select an image to upload." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(fileValue.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, or WebP image." }, { status: 400 });
  }
  if (fileValue.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Profile photos must be smaller than 5 MB." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const bucketResult = await supabase.storage.createBucket(BUCKET_NAME, { public: true, fileSizeLimit: `${MAX_FILE_SIZE}` });
    if (bucketResult.error && !bucketResult.error.message.toLowerCase().includes("already exists")) {
      throw bucketResult.error;
    }

    const extension = fileValue.type.split("/")[1] === "jpeg" ? "jpg" : fileValue.type.split("/")[1];
    const filePath = `${user.id}/avatar.${extension}`;
    const uploadResult = await supabase.storage.from(BUCKET_NAME).upload(filePath, fileValue, {
      upsert: true,
      contentType: fileValue.type,
      cacheControl: "3600",
    });
    if (uploadResult.error) throw uploadResult.error;

    const { data: publicUrl } = supabase.storage.from(BUCKET_NAME).getPublicUrl(uploadResult.data.path);
    const updateResult = await supabase.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, avatar_url: publicUrl.publicUrl } });
    if (updateResult.error) throw updateResult.error;

    return NextResponse.json({ url: publicUrl.publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload profile photo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
