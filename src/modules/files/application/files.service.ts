import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { StoredFile } from '../domain/storage.port';
import { FirebaseStorage } from '../infrastructure/firebase.storage';

@Injectable()
export class FilesService {
  constructor(private readonly firebase: FirebaseStorage) {}

  async upload(folder: string, file: Express.Multer.File): Promise<StoredFile> {
    const ext = (file.originalname.split('.').pop() || 'bin').toLowerCase();
    const safeName = file.originalname.replace(/[^\w.\-áéíóúñÁÉÍÓÚÑ ]+/g, '_');
    const storagePath = `${folder.replace(/^\/+|\/+$/g, '')}/${uuid()}-${safeName || `archivo.${ext}`}`;
    await this.firebase.put(storagePath, file.buffer, file.mimetype);
    return {
      storageKey: this.firebase.downloadUrl(storagePath),
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  signedUrl(key: string) {
    return this.firebase.signedUrl(key);
  }

  get(key: string) {
    return this.firebase.get(key);
  }

  remove(key: string) {
    return this.firebase.remove(key);
  }
}
