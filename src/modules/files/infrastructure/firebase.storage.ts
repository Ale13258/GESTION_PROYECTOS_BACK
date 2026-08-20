import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ObjectStorage } from '../domain/storage.port';

@Injectable()
export class FirebaseStorage implements ObjectStorage {
  constructor(private readonly config: ConfigService) {}

  bucket(): string {
    return this.config
      .get('FIREBASE_STORAGE_BUCKET', 'preubaproyecto.firebasestorage.app')
      .replace(/^gs:\/\//, '')
      .replace(/\/$/, '');
  }

  private objectUrl(key: string, extra = ''): string {
    return `https://firebasestorage.googleapis.com/v0/b/${this.bucket()}/o/${encodeURIComponent(key)}${extra}`;
  }

  async put(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    const url = `https://firebasestorage.googleapis.com/v0/b/${this.bucket()}/o?uploadType=media&name=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': mimeType || 'application/octet-stream' },
      body: new Uint8Array(buffer),
    });
    if (!res.ok) {
      throw new Error(`Firebase Storage ${res.status}: ${await res.text()}`);
    }
  }

  async get(key: string): Promise<Buffer> {
    if (key.startsWith('http://') || key.startsWith('https://')) {
      const res = await fetch(key);
      if (!res.ok) throw new Error(`No se pudo leer ${key}`);
      return Buffer.from(await res.arrayBuffer());
    }
    const res = await fetch(this.objectUrl(key, '?alt=media'));
    if (!res.ok) throw new Error(`No se pudo leer gs://${this.bucket()}/${key}`);
    return Buffer.from(await res.arrayBuffer());
  }

  async signedUrl(key: string): Promise<string> {
    if (key.startsWith('http://') || key.startsWith('https://')) return key;
    return this.objectUrl(key, '?alt=media');
  }

  async remove(key: string): Promise<void> {
    const path = key.startsWith('http') ? this.keyFromUrl(key) : key;
    if (!path) return;
    await fetch(this.objectUrl(path), { method: 'DELETE' });
  }

  downloadUrl(key: string, token?: string): string {
    const extra = token ? `?alt=media&token=${encodeURIComponent(token)}` : '?alt=media';
    return this.objectUrl(key, extra);
  }

  private keyFromUrl(url: string): string {
    try {
      const match = /\/o\/([^?]+)/.exec(url);
      return match ? decodeURIComponent(match[1]) : '';
    } catch {
      return '';
    }
  }
}
