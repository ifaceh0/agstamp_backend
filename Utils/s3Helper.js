// utils/s3Helper.js
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import path from "path";
import { ErrorHandler } from "./ErrorHandler.js";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

export const CLOUDFRONT_DOMAIN = "https://cdn.agstamp.com";

export const uploadBufferToS3 = async (
  buffer,
  originalFilename,
  folder = "stamps_images",
  customName = null,
  index = null
) => {
  const ext = path.extname(originalFilename).toLowerCase();

  let safeName;
  if (customName) {
    safeName = customName.replace(/\s+/g, "-").toLowerCase();
    safeName = index !== null ? `${safeName}-${index}` : `${safeName}-${Date.now()}`;
  } else {
    safeName = path.basename(originalFilename, ext).toLowerCase() + "-" + Date.now();
  }

  const key = folder ? `${folder}/${safeName}${ext}` : `${safeName}${ext}`;

  try {
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: `image/${ext.replace(".", "") || "jpeg"}`,
        // ACL: "public-read", // ← only if you use public bucket (most common for CloudFront)
        // CacheControl: "max-age=31536000", // optional - 1 year cache
      },
    });

    await upload.done();

    const publicUrl = `${CLOUDFRONT_DOMAIN}/${key}`;

    return {
      publicId: key,        // this is what you store and later delete with
      url: publicUrl,
      publicUrl: publicUrl,
    };
  } catch (err) {
    console.error("S3 upload failed:", err);
    throw new ErrorHandler(500, "Image upload failed");
  }
};

export const deleteFromS3 = async (key) => {
  if (!key) return;
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
  } catch (err) {
    console.warn(`S3 delete failed for ${key}:`, err.message);
    // usually not critical → continue
  }
};

export const deleteMultipleFromS3 = async (keys = []) => {
  if (!Array.isArray(keys) || keys.length === 0) return;
  await Promise.allSettled(keys.map(key => deleteFromS3(key)));
};