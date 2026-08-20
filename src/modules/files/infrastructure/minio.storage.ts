import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { ObjectStorage } from '../domain/storage.port';

@Injectable()
export class MinioStorage implements ObjectStorage, OnModuleInit {
  private client: Client;
  private bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get('MINIO_BUCKET', 'promanage');
    this.client = new Client({
      endPoint: config.get('MINIO_ENDPOINT', 'localhost'),
      port: Number(config.get('MINIO_PORT', 9000)),
      useSSL: config.get('MINIO_USE_SSL') === 'true',
      accessKey: config.get('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: config.get('MINIO_SECRET_KEY', 'minioadmin'),
    });
  }

  async onModuleInit() {
    if (this.config.get('STORAGE_DRIVER', 'local') !== 'minio') return;
    const exists = await this.client.bucketExists(this.bucket).catch(() => false);
    if (!exists) await this.client.makeBucket(this.bucket);
  }

  async put(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    await this.client.putObject(this.bucket, key, buffer, buffer.length, {
      'Content-Type': mimeType,
    });
  }

  async get(key: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks);
  }

  async signedUrl(key: string, expiresSeconds = 300): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, expiresSeconds);
  }

  async remove(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }
}
