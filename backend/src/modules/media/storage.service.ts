import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../../config';

const UPLOAD_ROOT = path.resolve(__dirname, '../../../uploads');
const BUCKET = 'media';

export interface StoredFile {
  filename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  thumbnailPath?: string;
}

function getSupabase(): SupabaseClient | null {
  const { supabaseUrl, supabaseServiceKey } = config.storage;
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export class StorageService {
  private useSupabase(): boolean {
    return !!getSupabase();
  }

  async storeFile(
    file: Express.Multer.File,
    category: 'photos' | 'albums' | 'messages' | 'temp'
  ): Promise<StoredFile> {
    const ext = path.extname(file.originalname) || this.extFromMime(file.mimetype);
    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `${hash}${ext}`;
    const storagePath = `/${category}/${filename}`;
    const objectPath = `${category}/${filename}`;

    if (this.useSupabase()) {
      return this.storeToSupabase(file, category, hash, filename, objectPath, storagePath);
    }

    return this.storeToLocal(file, category, hash, filename, storagePath);
  }

  private async storeToSupabase(
    file: Express.Multer.File,
    category: string,
    hash: string,
    filename: string,
    objectPath: string,
    storagePath: string
  ): Promise<StoredFile> {
    const supabase = getSupabase()!;

    let buffer: Buffer;
    let mimeType = file.mimetype;
    let sizeBytes = file.size;

    if (this.isImage(file.mimetype)) {
      const resized = await sharp(file.buffer)
        .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      buffer = resized;
      mimeType = 'image/jpeg';
      sizeBytes = buffer.length;

      const { error } = await supabase.storage.from(BUCKET).upload(objectPath, buffer, {
        contentType: mimeType,
        upsert: true,
      });
      if (error) throw new Error(`Supabase upload failed: ${error.message}`);

      const thumbPath = `${category}/thumbs/thumb_${hash}.jpg`;
      const thumbBuffer = await sharp(file.buffer)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toBuffer();

      await supabase.storage.from(BUCKET).upload(thumbPath, thumbBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

      return {
        filename,
        storagePath,
        mimeType,
        sizeBytes,
        thumbnailPath: `/${category}/thumbs/thumb_${hash}.jpg`,
      };
    }

    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    return { filename, storagePath, mimeType, sizeBytes };
  }

  private async storeToLocal(
    file: Express.Multer.File,
    category: string,
    hash: string,
    filename: string,
    storagePath: string
  ): Promise<StoredFile> {
    const dir = path.join(UPLOAD_ROOT, category);
    await fs.mkdir(dir, { recursive: true });
    const fullPath = path.join(dir, filename);

    if (this.isImage(file.mimetype)) {
      await sharp(file.buffer)
        .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(fullPath);

      const thumbDir = path.join(dir, 'thumbs');
      await fs.mkdir(thumbDir, { recursive: true });
      const thumbPath = path.join(thumbDir, `thumb_${hash}.jpg`);
      await sharp(file.buffer)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toFile(thumbPath);

      const stat = await fs.stat(fullPath);
      return {
        filename,
        storagePath,
        mimeType: 'image/jpeg',
        sizeBytes: stat.size,
        thumbnailPath: `/${category}/thumbs/thumb_${hash}.jpg`,
      };
    }

    await fs.writeFile(fullPath, file.buffer);
    return {
      filename,
      storagePath,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    };
  }

  async deleteFile(storagePath: string): Promise<void> {
    if (this.useSupabase()) {
      const objectPath = storagePath.replace(/^\//, '');
      await getSupabase()!.storage.from(BUCKET).remove([objectPath]);
      const match = objectPath.match(/^([^/]+)\/(.+)$/);
      if (match) {
        const [, category, filename] = match;
        const stem = filename.replace(/\.[^.]+$/, '');
        const thumbPath = `${category}/thumbs/thumb_${stem}.jpg`;
        await getSupabase()!.storage.from(BUCKET).remove([thumbPath]).catch(() => {});
      }
      return;
    }

    const fullPath = path.join(UPLOAD_ROOT, storagePath);
    await fs.unlink(fullPath).catch(() => {});
    const thumbPath = fullPath.replace(/\/([^/]+)$/, '/thumbs/thumb_$1').replace(/\.\w+$/, '.jpg');
    await fs.unlink(thumbPath).catch(() => {});
  }

  getFullPath(storagePath: string): string {
    return path.join(UPLOAD_ROOT, storagePath);
  }

  private isImage(mime: string): boolean {
    return mime.startsWith('image/');
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp',
      'image/gif': '.gif', 'video/mp4': '.mp4',
    };
    return map[mime] || '.bin';
  }
}
