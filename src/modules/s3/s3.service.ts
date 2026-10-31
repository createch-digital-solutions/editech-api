import 'dotenv/config';
import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3: S3Client | null = null;
  private readonly defaultBucket =
    process.env.R2_BUCKET_NAME || 'createch-videos';

  constructor() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const endpoint = process.env.AWS_ENDPOINT_URL_S3 || process.env.S3_ENDPOINT;
    const region = process.env.AWS_REGION || 'auto';

    if (accessKeyId && secretAccessKey) {
      this.s3 = new S3Client({
        region,
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log('S3/R2 client initialized successfully');
    } else {
      this.logger.warn(
        'S3/R2 credentials not set. Running in stub/development mode.',
      );
    }
  }

  /**
   * Generate a signed PUT URL for direct browser-to-R2 upload (Phase 14 Flow B)
   */
  async getUploadPresignedUrl(
    key: string,
    contentType = 'video/mp4',
    expiresIn = 900,
    bucket = this.defaultBucket,
  ): Promise<{ uploadUrl: string; key: string; expiresIn: number }> {
    if (!this.s3) {
      this.logger.warn(`Stub upload URL generated for key: ${key}`);
      return {
        uploadUrl: `https://storage.createch.example.com/${bucket}/${key}?stub=true`,
        key,
        expiresIn,
      };
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn });
    return { uploadUrl, key, expiresIn };
  }

  /**
   * Verify whether a file exists in the bucket
   */
  async fileExists(key: string, bucket = this.defaultBucket): Promise<boolean> {
    if (!this.s3) return true;
    try {
      const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
      await this.s3.send(command);
      return true;
    } catch {
      return false;
    }
  }

  async uploadFile(
    bucket = this.defaultBucket,
    key: string,
    body: Buffer | Uint8Array | string,
  ) {
    if (!this.s3) return { key, stub: true };
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
    });
    await this.s3.send(command);
    return { key };
  }

  async getPresignedUrl(
    bucket = this.defaultBucket,
    key: string,
    expiresIn = 3600,
  ) {
    if (!this.s3) return `https://cdn.createch.example.com/${bucket}/${key}`;
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return await getSignedUrl(this.s3, command, { expiresIn });
  }
}
