import { Request, Response, NextFunction } from 'express';
import { ContentService } from './content.service';

const contentService = new ContentService();

export class ContentController {
  async getContent(req: Request, res: Response, next: NextFunction) {
    try {
      const keysParam = req.query.keys as string | undefined;
      const keys = keysParam ? keysParam.split(',').map((k) => k.trim()).filter(Boolean) : ['guides', 'norms'];
      const locale = (req.query.locale as string) || 'en';
      const slots = await contentService.getByKeys(keys, locale);
      const data = Object.fromEntries(slots.map((s) => [s.key, s]));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async getGuides(req: Request, res: Response, next: NextFunction) {
    try {
      const locale = (req.query.locale as string) || 'en';
      const slot = await contentService.getByKey('guides', locale);
      res.json({ data: slot || { key: 'guides', title: null, bodyMd: null, link: null, locale } });
    } catch (err) {
      next(err);
    }
  }

  async getNorms(req: Request, res: Response, next: NextFunction) {
    try {
      const locale = (req.query.locale as string) || 'en';
      const slot = await contentService.getByKey('norms', locale);
      res.json({ data: slot || { key: 'norms', title: null, bodyMd: null, link: null, locale } });
    } catch (err) {
      next(err);
    }
  }
}
