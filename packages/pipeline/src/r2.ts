// Minimal S3 client for Cloudflare R2 (AWS Signature V4), so the pipeline needs no SDK.
import { createHash, createHmac } from "node:crypto";

export type R2Keys = { accountId: string; accessKeyId: string; secretAccessKey: string; bucket: string; publicUrl: string };

export function readR2Keys(): R2Keys {
  const get = (k: string): string => {
    const v = process.env[k];
    if (!v) throw new Error(`${k} is missing from .env (see docs/r2-setup.md)`);
    return v;
  };
  return { accountId: get("R2_ACCOUNT_ID"), accessKeyId: get("R2_ACCESS_KEY_ID"), secretAccessKey: get("R2_SECRET_ACCESS_KEY"), bucket: get("R2_BUCKET"), publicUrl: get("R2_PUBLIC_URL").replace(/\/$/, "") };
}

const hmac = (key: Buffer | string, data: string): Buffer => createHmac("sha256", key).update(data).digest();

/** Signed request headers for one object; the payload is left unsigned, which R2 accepts over HTTPS. */
export function signedHeaders(k: R2Keys, method: string, key: string, now = new Date()): { url: string; headers: Record<string, string> } {
  const host = `${k.accountId}.r2.cloudflarestorage.com`;
  const path = `/${k.bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
  const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const day = amzDate.slice(0, 8);
  const scope = `${day}/auto/s3/aws4_request`;
  const payload = "UNSIGNED-PAYLOAD";
  const canonical = [method, path, "", `host:${host}`, `x-amz-content-sha256:${payload}`, `x-amz-date:${amzDate}`, "", "host;x-amz-content-sha256;x-amz-date", payload].join("\n");
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, createHash("sha256").update(canonical).digest("hex")].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${k.secretAccessKey}`, day), "auto"), "s3"), "aws4_request");
  const signature = createHmac("sha256", signingKey).update(toSign).digest("hex");
  return {
    url: `https://${host}${path}`,
    headers: {
      "x-amz-content-sha256": payload,
      "x-amz-date": amzDate,
      authorization: `AWS4-HMAC-SHA256 Credential=${k.accessKeyId}/${scope}, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signature}`,
    },
  };
}

/** True when the object already exists in the bucket. */
export async function r2Has(k: R2Keys, key: string): Promise<boolean> {
  const { url, headers } = signedHeaders(k, "HEAD", key);
  const res = await fetch(url, { method: "HEAD", headers });
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`R2 HEAD ${key}: ${res.status}`);
  return true;
}

export async function r2Put(k: R2Keys, key: string, body: Uint8Array<ArrayBuffer>, contentType: string): Promise<void> {
  const { url, headers } = signedHeaders(k, "PUT", key);
  const res = await fetch(url, { method: "PUT", headers: { ...headers, "content-type": contentType, "cache-control": "public, max-age=31536000, immutable" }, body });
  if (!res.ok) throw new Error(`R2 PUT ${key}: ${res.status} ${await res.text()}`);
}
