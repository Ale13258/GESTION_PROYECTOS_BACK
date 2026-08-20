import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { ObjectStorage } from '../domain/storage.port';

@Injectable()
export class LocalStorage implements ObjectStorage {
  constructor(private readonly config: ConfigService) {}

  private root() {
    return this.config.get('STORAGE_LOCAL_DIR', './storage');
  }

  async put(key: string, buffer: Buffer, _mimeType?: string): Promise<void> {
    const path = join(this.root(), key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, buffer);
  }

  async get(key: string): Promise<Buffer> {
    return readFile(join(this.root(), key));
  }

  async signedUrl(key: string): Promise<string> {
    return `/api/v1/files/stream?key=${encodeURIComponent(key)}`;
  }

  async remove(key: string): Promise<void> {
    try {
      await unlink(join(this.root(), key));
    } catch {
      /* ignore */
    }
  }
}
