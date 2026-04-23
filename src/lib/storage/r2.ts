import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "node:stream";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ENDPOINT =
  process.env.R2_ENDPOINT ||
  (R2_ACCOUNT_ID
    ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined);

const assertR2Config = () => {
  if (
    !R2_ENDPOINT ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET_NAME
  ) {
    throw new Error("Cloudflare R2の環境変数が不足しています。");
  }
};

const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: R2_SECRET_ACCESS_KEY ?? "",
  },
});

export async function uploadAudio(
  key: string,
  buffer: Buffer,
  contentType: string
) {
  assertR2Config();

  await s3Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return { key };
}

export async function getSignedAudioUrl(
  key: string,
  expiresInSeconds: number = 3600
) {
  assertR2Config();

  return getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }),
    { expiresIn: expiresInSeconds }
  );
}

export async function downloadAudio(key: string): Promise<Buffer> {
  assertR2Config();

  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );

  if (!response.Body) {
    throw new Error("R2から音声ファイルを取得できませんでした。");
  }

  if (response.Body instanceof Readable) {
    const chunks: Buffer[] = [];

    for await (const chunk of response.Body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  if (response.Body instanceof ReadableStream) {
    const chunks: Uint8Array[] = [];
    const reader = response.Body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return Buffer.concat(chunks);
  }

  throw new Error("R2の音声ファイル形式を読み取れませんでした。");
}

export async function deleteAudio(key: string) {
  assertR2Config();

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
}
