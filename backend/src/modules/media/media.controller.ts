import { Request, Response, NextFunction } from 'express';
import { MediaService } from './media.service';
import { AlbumService } from './album.service';

const mediaSvc = new MediaService();
const albumSvc = new AlbumService();

export class MediaController {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) { res.status(400).json({ error: { message: 'No file provided' } }); return; }
      const { category, expiresInSeconds, isNsfw } = req.body;
      const result = await mediaSvc.uploadMedia(
        req.user!.userId, req.file,
        category || 'photos',
        { expiresInSeconds: expiresInSeconds ? parseInt(expiresInSeconds) : undefined, isNsfw: isNsfw === 'true' }
      );
      res.status(201).json({ data: result });
    } catch (err) { next(err); }
  }

  async uploadSelfDestructing(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) { res.status(400).json({ error: { message: 'No file provided' } }); return; }
      const ttl = parseInt(req.body.ttlSeconds || '30');
      const result = await mediaSvc.uploadMedia(req.user!.userId, req.file, 'messages', { expiresInSeconds: ttl });
      res.status(201).json({ data: { ...result, selfDestructing: true, ttlSeconds: ttl } });
    } catch (err) { next(err); }
  }

  async getMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const media = await mediaSvc.getMedia(req.params.id as string, req.user!.userId);
      if (!media) { res.status(404).json({ error: { message: 'Media not found or access denied' } }); return; }
      res.json({ data: media });
    } catch (err) { next(err); }
  }

  async getMyMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const media = await mediaSvc.getUserMedia(req.user!.userId);
      res.json({ data: media, count: media.length });
    } catch (err) { next(err); }
  }

  async deleteMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const deleted = await mediaSvc.deleteMedia(req.params.id as string, req.user!.userId);
      if (!deleted) { res.status(404).json({ error: { message: 'Media not found' } }); return; }
      res.status(204).send();
    } catch (err) { next(err); }
  }

  async trackView(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await mediaSvc.trackView(req.params.id as string, req.user!.userId, req.body.durationMs);
      res.json({ data: result });
    } catch (err) { next(err); }
  }

  // Album endpoints
  async createAlbum(req: Request, res: Response, next: NextFunction) {
    try {
      const album = await albumSvc.createAlbum(req.user!.userId, req.body.name, req.body.description, req.body.isPrivate);
      res.status(201).json({ data: album });
    } catch (err) { next(err); }
  }

  async getMyAlbums(req: Request, res: Response, next: NextFunction) {
    try {
      const albums = await albumSvc.getMyAlbums(req.user!.userId);
      res.json({ data: albums, count: albums.length });
    } catch (err) { next(err); }
  }

  async getAlbum(req: Request, res: Response, next: NextFunction) {
    try {
      const album = await albumSvc.getAlbum(req.params.id as string, req.user!.userId);
      if (!album) { res.status(404).json({ error: { message: 'Album not found or access denied' } }); return; }
      res.json({ data: album });
    } catch (err) { next(err); }
  }

  async getSharedAlbums(req: Request, res: Response, next: NextFunction) {
    try {
      const albums = await albumSvc.getSharedWithMe(req.user!.userId);
      res.json({ data: albums, count: albums.length });
    } catch (err) { next(err); }
  }

  async addToAlbum(req: Request, res: Response, next: NextFunction) {
    try {
      await albumSvc.addMediaToAlbum(req.params.id as string, req.body.mediaId, req.user!.userId);
      res.json({ data: { message: 'Added to album' } });
    } catch (err) { next(err); }
  }

  async removeFromAlbum(req: Request, res: Response, next: NextFunction) {
    try {
      await albumSvc.removeMediaFromAlbum(req.params.id as string, req.params.mediaId as string, req.user!.userId);
      res.status(204).send();
    } catch (err) { next(err); }
  }

  async shareAlbum(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await albumSvc.shareAlbum(
        req.params.id as string, req.user!.userId, req.body.userId,
        { canDownload: req.body.canDownload, expiresInHours: req.body.expiresInHours }
      );
      res.json({ data: result });
    } catch (err) { next(err); }
  }

  async revokeShare(req: Request, res: Response, next: NextFunction) {
    try {
      await albumSvc.revokeAlbumShare(req.params.id as string, req.user!.userId, req.params.userId as string);
      res.status(204).send();
    } catch (err) { next(err); }
  }

  async deleteAlbum(req: Request, res: Response, next: NextFunction) {
    try {
      await albumSvc.deleteAlbum(req.params.id as string, req.user!.userId);
      res.status(204).send();
    } catch (err) { next(err); }
  }
}
