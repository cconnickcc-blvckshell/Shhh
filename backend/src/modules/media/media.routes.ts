import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { MediaController } from './media.controller';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();
const ctrl = new MediaController();

function validateFileMagic(req: Request, _res: Response, next: NextFunction) {
  const file = req.file;
  if (!file?.buffer) return next();

  const buf = file.buffer as Buffer;
  const valid =
    (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) || // JPEG
    (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) || // PNG
    (buf.length >= 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) || // WebP
    (buf.length >= 4 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) || // GIF
    (buf.length >= 12 && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70); // MP4 (ftyp)

  if (!valid) {
    return next(Object.assign(new Error('Invalid file type. Allowed: JPEG, PNG, WebP, GIF, MP4.'), { statusCode: 400 }));
  }
  next();
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const createAlbumSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().optional(),
});

const shareAlbumSchema = z.object({
  userId: z.string().uuid().optional(),
  targetPersonaId: z.string().uuid().optional(),
  targetCoupleId: z.string().uuid().optional(),
  canDownload: z.boolean().optional(),
  expiresInHours: z.number().positive().optional(),
  watermarkMode: z.enum(['off', 'subtle', 'invisible']).optional(),
  notifyOnView: z.boolean().optional(),
}).refine(d => !!(d.userId ?? d.targetPersonaId ?? d.targetCoupleId), { message: 'One of userId, targetPersonaId, targetCoupleId required' });

// Media endpoints
router.post('/upload', authenticate, upload.single('file'), validateFileMagic, ctrl.upload);
router.post('/upload/self-destruct', authenticate, upload.single('file'), validateFileMagic, ctrl.uploadSelfDestructing);
router.get('/my', authenticate, ctrl.getMyMedia);
router.get('/:id', authenticate, ctrl.getMedia);
router.delete('/:id', authenticate, ctrl.deleteMedia);
router.post('/:id/view', authenticate, ctrl.trackView);

// Album endpoints
router.post('/albums', authenticate, validate(createAlbumSchema), ctrl.createAlbum);
router.get('/albums/my', authenticate, ctrl.getMyAlbums);
router.get('/albums/shared', authenticate, ctrl.getSharedAlbums);
router.get('/albums/:id', authenticate, ctrl.getAlbum);
router.delete('/albums/:id', authenticate, ctrl.deleteAlbum);
router.post('/albums/:id/media', authenticate, validate(z.object({ mediaId: z.string().uuid() })), ctrl.addToAlbum);
router.delete('/albums/:id/media/:mediaId', authenticate, ctrl.removeFromAlbum);
router.post('/albums/:id/share', authenticate, validate(shareAlbumSchema), ctrl.shareAlbum);
router.delete('/albums/:id/share/:userId', authenticate, ctrl.revokeShare);

export default router;
