"use client";

export type TournamentBrandingKind = "banner" | "logo";

const WEBP_TYPE = "image/webp";
const JPEG_TYPE = "image/jpeg";
const PNG_TYPE = "image/png";

const profiles: Record<TournamentBrandingKind, { maxDimension: number; targetBytes: number }> = {
  banner: { maxDimension: 2000, targetBytes: 500 * 1024 },
  logo: { maxDimension: 800, targetBytes: 200 * 1024 },
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected image could not be processed."));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function supportsWebp(canvas: HTMLCanvasElement): boolean {
  return canvas.toDataURL(WEBP_TYPE).startsWith(`data:${WEBP_TYPE}`);
}

function outputName(file: File, type: string): string {
  const extension = type === WEBP_TYPE ? "webp" : type === JPEG_TYPE ? "jpg" : "png";
  return `${file.name.replace(/\.[^.]+$/, "")}.${extension}`;
}

export async function optimizeTournamentBrandingImage(file: File, kind: TournamentBrandingKind): Promise<File> {
  const image = await loadImage(file);
  const profile = profiles[kind];
  const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
  let scale = Math.min(1, profile.maxDimension / longestSide);
  const canvas = document.createElement("canvas");
  const webpSupported = supportsWebp(canvas);
  const outputType = webpSupported ? WEBP_TYPE : file.type === JPEG_TYPE ? JPEG_TYPE : PNG_TYPE;
  const qualitySteps = outputType === PNG_TYPE ? [undefined] : [0.84, 0.78, 0.7, 0.62, 0.55];
  let smallestBlob: Blob | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is not supported in this browser.");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of qualitySteps) {
      const blob = await canvasToBlob(canvas, outputType, quality);
      if (!blob) continue;
      if (!smallestBlob || blob.size < smallestBlob.size) smallestBlob = blob;
      if (blob.size <= profile.targetBytes) {
        return new File([blob], outputName(file, outputType), { type: outputType });
      }
    }

    scale *= 0.85;
  }

  if (!smallestBlob) throw new Error("The selected image could not be compressed.");
  return new File([smallestBlob], outputName(file, outputType), { type: outputType });
}