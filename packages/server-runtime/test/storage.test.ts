import { describe, it, expect } from 'vitest';
import { S3StorageClient, parseStorageUri } from '../src/storage/s3';

describe('S3 / MinIO Object Storage Adapter', () => {
  const client = new S3StorageClient({
    endpoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadminpassword',
    defaultBucket: 'homedash-assets',
  });

  it('should generate valid presigned PUT URL for client-side uploads', async () => {
    const key = 'receipts/2026/03/invoice-1234.pdf';
    const presigned = await client.getPresignedPutUrl(key, {
      contentType: 'application/pdf',
      expiresInSeconds: 300,
    });

    expect(presigned).toBeDefined();
    expect(presigned).toContain('http://localhost:9000/homedash-assets/receipts/2026/03/invoice-1234.pdf');
    expect(presigned).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
    expect(presigned).toContain('X-Amz-Credential=minioadmin');
    expect(presigned).toContain('X-Amz-Signature=');
  });

  it('should generate valid presigned GET URL for viewing attachments', async () => {
    const key = 'receipts/2026/03/invoice-1234.pdf';
    const presigned = await client.getPresignedGetUrl(key, 600);

    expect(presigned).toBeDefined();
    expect(presigned).toContain('http://localhost:9000/homedash-assets/receipts/2026/03/invoice-1234.pdf');
    expect(presigned).toContain('X-Amz-Expires=600');
  });

  it('should parse storage URIs correctly', () => {
    const parsed1 = parseStorageUri('s3://homedash-assets/vault/enc-doc-1.bin');
    expect(parsed1.bucket).toBe('homedash-assets');
    expect(parsed1.key).toBe('vault/enc-doc-1.bin');

    const parsed2 = parseStorageUri('http://localhost:9000/homedash-assets/avatars/user-1.jpg');
    expect(parsed2.bucket).toBe('homedash-assets');
    expect(parsed2.key).toBe('avatars/user-1.jpg');
  });
});
