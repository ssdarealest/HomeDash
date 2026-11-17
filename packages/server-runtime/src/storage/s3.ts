export interface S3ClientOptions {
  endpoint: string;
  port?: number;
  useSSL?: boolean;
  accessKey: string;
  secretKey: string;
  defaultBucket?: string;
  region?: string;
}

export interface PresignedPutOptions {
  contentType?: string;
  expiresInSeconds?: number;
  bucket?: string;
}

export function parseStorageUri(uri: string): { bucket: string; key: string } {
  if (uri.startsWith('s3://')) {
    const trimmed = uri.slice(5);
    const slashIdx = trimmed.indexOf('/');
    if (slashIdx === -1) {
      return { bucket: trimmed, key: '' };
    }
    return {
      bucket: trimmed.slice(0, slashIdx),
      key: trimmed.slice(slashIdx + 1),
    };
  }

  // HTTP URL parse: http(s)://endpoint[:port]/bucket/key
  try {
    const url = new URL(uri);
    const parts = url.pathname.replace(/^\//, '').split('/');
    const bucket = parts[0] || '';
    const key = parts.slice(1).join('/');
    return { bucket, key };
  } catch {
    return { bucket: '', key: uri };
  }
}

async function hmacSha256(key: Uint8Array | string, data: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const rawKey = typeof key === 'string' ? enc.encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
  return new Uint8Array(signature);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export class S3StorageClient {
  private endpoint: string;
  private port?: number;
  private useSSL: boolean;
  private accessKey: string;
  private secretKey: string;
  private defaultBucket: string;
  private region: string;

  constructor(opts: S3ClientOptions) {
    this.endpoint = opts.endpoint;
    this.port = opts.port;
    this.useSSL = opts.useSSL ?? false;
    this.accessKey = opts.accessKey;
    this.secretKey = opts.secretKey;
    this.defaultBucket = opts.defaultBucket || 'homedash-assets';
    this.region = opts.region || 'us-east-1';
  }

  private getBaseUrl(): string {
    const proto = this.useSSL ? 'https' : 'http';
    const portPart = this.port ? `:${this.port}` : '';
    return `${proto}://${this.endpoint}${portPart}`;
  }

  async getPresignedPutUrl(key: string, opts?: PresignedPutOptions): Promise<string> {
    const bucket = opts?.bucket || this.defaultBucket;
    const expiresIn = opts?.expiresInSeconds || 300;
    return this.generatePresignedUrl('PUT', bucket, key, expiresIn);
  }

  async getPresignedGetUrl(key: string, expiresInSeconds: number = 600, bucket?: string): Promise<string> {
    const b = bucket || this.defaultBucket;
    return this.generatePresignedUrl('GET', b, key, expiresInSeconds);
  }

  private async generatePresignedUrl(
    method: string,
    bucket: string,
    key: string,
    expiresIn: number
  ): Promise<string> {
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;

    const host = this.port ? `${this.endpoint}:${this.port}` : this.endpoint;
    const cleanKey = key.startsWith('/') ? key.slice(1) : key;
    const canonicalUri = `/${bucket}/${cleanKey}`;

    const queryParams: Record<string, string> = {
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${this.accessKey}/${credentialScope}`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': expiresIn.toString(),
      'X-Amz-SignedHeaders': 'host',
    };

    const canonicalQuery = Object.keys(queryParams)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
      .join('&');

    const canonicalHeaders = `host:${host}\n`;
    const payloadHash = 'UNSIGNED-PAYLOAD';

    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQuery,
      canonicalHeaders,
      'host',
      payloadHash,
    ].join('\n');

    const enc = new TextEncoder();
    const hashedCanonicalRequest = bytesToHex(
      new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(canonicalRequest)))
    );

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      hashedCanonicalRequest,
    ].join('\n');

    // Key derivation
    const kDate = await hmacSha256(`AWS4${this.secretKey}`, dateStamp);
    const kRegion = await hmacSha256(kDate, this.region);
    const kService = await hmacSha256(kRegion, 's3');
    const kSigning = await hmacSha256(kService, 'aws4_request');

    const signature = bytesToHex(await hmacSha256(kSigning, stringToSign));

    return `${this.getBaseUrl()}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  }
}
