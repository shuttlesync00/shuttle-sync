import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const BUCKET_NAME = "tournament-assets";
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request, { params }: { params: Promise<{ tournamentId: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const { tournamentId } = await params;
  const tournament = await prisma?.tournament.findUnique({ where: { id: tournamentId }, select: { ownerId: true } });
  if (!tournament) return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
  if (tournament.ownerId !== user.id) return NextResponse.json({ error: "Unauthorized." }, { status: 403 });

  const formData = await request.formData();
  const kindValue = formData.get("kind");
  const fileValue = formData.get("file");
  if (kindValue !== "banner" && kindValue !== "logo") return NextResponse.json({ error: "Branding type is required." }, { status: 400 });
  if (!(fileValue instanceof File)) return NextResponse.json({ error: "Please select an image file." }, { status: 400 });
  if (!ALLOWED_TYPES.has(fileValue.type)) return NextResponse.json({ error: "Use a JPG, PNG, or WebP image." }, { status: 400 });
  if (fileValue.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Branding images must be smaller than 8 MB." }, { status: 400 });

  try {
    const supabase = createAdminClient();
    const bucketResult = await supabase.storage.createBucket(BUCKET_NAME, { public: true, fileSizeLimit: `${MAX_FILE_SIZE}` });
    if (bucketResult.error && !bucketResult.error.message.toLowerCase().includes("already exists")) throw bucketResult.error;

    const path = `tournaments/${tournamentId}/${kindValue}`;
    const uploadResult = await supabase.storage.from(BUCKET_NAME).upload(path, fileValue, { upsert: true, contentType: fileValue.type, cacheControl: "3600" });
    if (uploadResult.error) throw uploadResult.error;

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(uploadResult.data.path);
    const field = kindValue === "banner" ? "bannerUrl" : "logoUrl";
    await prisma?.tournament.update({ where: { id: tournamentId }, data: { [field]: data.publicUrl } });
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : `${kindValue === "banner" ? "Banner" : "Logo"} upload failed. Please try again.`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
