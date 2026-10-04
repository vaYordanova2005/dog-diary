import { v2 as cloudinary } from "cloudinary";

// The keys come from .env (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export { MAX_FILE_BYTES, classifyFile } from "@/lib/fileTypes";

export async function destroyFiles(files: { publicId: string; resourceType: string }[]) {
  // If Cloudinary fails, we don't stop deleting the record — we only log it
  await Promise.all(
    files.map((file) =>
      cloudinary.uploader
        .destroy(file.publicId, { resource_type: file.resourceType })
        .catch((error) => console.error("Cloudinary destroy failed", file.publicId, error)),
    ),
  );
}
