import "dotenv/config";
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      endpoint: process.env.S3_ENDPOINT, // Neon or AWS
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? (() => { throw new Error('AWS_ACCESS_KEY_ID is not set in environment variables'); })(),
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? (() => { throw new Error('AWS_SECRET_ACCESS_KEY is not set in environment variables'); })(),
      },
    });
  }

  async uploadFile(bucket = "editech-bucket", key: string, body: Buffer | Uint8Array | string) {
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, Body: body });
    await this.s3.send(command);
    return { key };
  }

  async getPresignedUrl(bucket = "editech-bucket", key: string, expiresIn = 3600) {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return await getSignedUrl(this.s3, command, { expiresIn });
  }
}
