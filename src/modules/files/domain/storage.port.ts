export type StoredFile = {
  storageKey: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export interface ObjectStorage {
  put(key: string, buffer: Buffer, mimeType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  signedUrl(key: string, expiresSeconds?: number): Promise<string>;
  remove(key: string): Promise<void>;
}
