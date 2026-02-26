import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import crypto from 'crypto';

const UPLOAD_ROOT = path.resolve(__dirname, '../../../uploads');

export interface StoredFile {
  filename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  thumbnailPath?: string;
}

export class StorageService {
  async storeFile(
    file: Express.Multer.File,
    category: 'photos' | 'albums' | 'messages' | 'temp'
  ): Promise<StoredFile> {
    const ext = path.extname(file.originalname) || this.extFromMime(file.mimetype);
    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `${hash}${ext}`;
    const dir = path.join(UPLOAD_ROOT, category);
    await fs.mkdir(dir, { recursive: true });
    const storagePath = path.join(dir, filename);

    if (this.isImage(file.mimetype)) {
      await sharp(file.buffer)
        .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(storagePath);

      const thumbDir = path.join(dir, 'thumbs');
      await fs.mkdir(thumbDir, { recursive: true });
      const thumbPath = path.join(thumbDir, `thumb_${hash}.jpg`);
      await sharp(file.buffer)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toFile(thumbPath);

      const stat = await fs.stat(storagePath);
      return {
        filename,
        storagePath: `/${category}/${filename}`,
        mimeType: 'image/jpeg',
        sizeBytes: stat.size,
        thumbnailPath: `/${category}/thumbs/thumb_${hash}.jpg`,
      };
    }

    await fs.writeFile(storagePath, file.buffer);
    return {
      filename,
      storagePath: `/${category}/${filename}`,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    };
  }

  async deleteFile(storagePath: string): Promise<void> {
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
