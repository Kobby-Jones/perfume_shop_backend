import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";

const {
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME,
} = process.env;

if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !S3_BUCKET_NAME) {
  throw new Error("Missing AWS env variables.");
}

export const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

export async function uploadBufferToS3(buffer: Buffer, key: string, contentType: string) {
  const bucket = S3_BUCKET_NAME!;

  const params: PutObjectCommandInput = {
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: "public-read", // typed correctly now
  };

  const cmd = new PutObjectCommand(params);
  await s3Client.send(cmd);

  const url = `https://${bucket}.s3.${AWS_REGION}.amazonaws.com/${encodeURIComponent(key)}`;
  return url;
}
