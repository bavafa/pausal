# Setting up Cloudflare R2 for product images

R2 holds the 256 px product images for the whole 20,000 item slice, so upload results can show any product (see `docs/upload-plan.md`). Free tier: 10 GB of storage, 1 million writes and 10 million reads a month, and no download fees. Our images are an estimated 300 MB.

## 1. Create the account and turn on R2
1. Sign up at dash.cloudflare.com (free plan).
2. In the left sidebar open **R2 Object Storage**.
3. Cloudflare asks for a payment card before R2 works, even on the free tier. Nothing is charged while usage stays inside the free limits. Add the card and accept the R2 terms.

## 2. Create the bucket
1. **R2 Object Storage > Create bucket**.
2. Name: `pausal-images`. Location: Automatic. Storage class: Standard.
3. Create.

## 3. Make the images readable by the site
1. Open the bucket, then **Settings**.
2. Under **Public Development URL**, click **Enable** and confirm. Copy the URL it shows (it looks like `https://pub-<random>.r2.dev`). This URL is rate limited and meant for small projects, which fits Pausal. A custom domain can replace it later if you ever add a domain to Cloudflare.
3. Under **CORS Policy**, click **Add CORS policy** and paste:

```json
[
  {
    "AllowedOrigins": ["https://bavafa.github.io", "http://localhost:5173"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

## 4. Create an upload key for the author's machine
1. Back on the **R2 Object Storage** overview, open **Manage API tokens** (under Account details), then **Create Account API token** (or a User API token).
2. Name: `pausal-upload`. Permissions: **Object Read & Write**. Apply to specific buckets only: `pausal-images`. TTL: forever (or a date you choose).
3. Create. Cloudflare shows the **Access Key ID**, the **Secret Access Key** and the S3 endpoint (`https://<account id>.r2.cloudflarestorage.com`) once only.
4. Put them in the project's `.env` file (it is git-ignored), not in chat:

```
R2_ACCOUNT_ID=<account id from the endpoint>
R2_ACCESS_KEY_ID=<access key id>
R2_SECRET_ACCESS_KEY=<secret access key>
R2_BUCKET=pausal-images
R2_PUBLIC_URL=https://pub-<random>.r2.dev
```

## 5. Then
Say "R2 is set up". Claude then adds an upload step to `pnpm abo` that copies each slice image to `products/<imageId>.jpg` in the bucket, checks one image through the public URL, and points the relay at `R2_PUBLIC_URL`. The secret key stays on the author's machine; the site and the relay only need the public URL.
