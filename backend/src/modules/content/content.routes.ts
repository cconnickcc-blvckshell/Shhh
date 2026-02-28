import { Router } from 'express';
import { ContentController } from './content.controller';

const router = Router();
const controller = new ContentController();

router.get('/', controller.getContent);
router.get('/guides', controller.getGuides);
router.get('/norms', controller.getNorms);

export default router;
