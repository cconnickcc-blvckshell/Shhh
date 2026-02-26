import { Router } from 'express';
import { z } from 'zod';
import { UsersController } from './users.controller';
import { validate } from '../../middleware/validation';
import { authenticate, requireTier } from '../../middleware/auth';
import { query } from '../../config/database';

const router = Router();
const controller = new UsersController();

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  gender: z.string().max(30).optional(),
  sexuality: z.string().max(50).optional(),
  photosJson: z.array(z.any()).optional(),
  preferencesJson: z.record(z.any()).optional(),
  kinks: z.array(z.string()).optional(),
  experienceLevel: z.enum(['new', 'curious', 'experienced', 'veteran']).optional(),
  isHost: z.boolean().optional(),
});

const reportSchema = z.object({
  reason: z.string().min(3).max(50),
  description: z.string().max(1000).optional(),
});

router.get('/me', authenticate, controller.getMe);
router.put('/me', authenticate, validate(updateProfileSchema), controller.updateMe);

// Full public profile for detail view
router.get('/:id/profile', authenticate, async (req, res, next) => {
  try {
    const userId = req.params.id as string;
    const [profile, refs, trust, intents, presence] = await Promise.all([
      query(`
        SELECT up.*, u.verification_tier, u.created_at as joined_at
        FROM user_profiles up JOIN users u ON up.user_id = u.id
        WHERE up.user_id = $1 AND u.deleted_at IS NULL
      `, [userId]),
      query(`
        SELECT COUNT(*) as total, AVG(rating) as avg_rating
        FROM user_references WHERE to_user_id = $1 AND is_visible = true
      `, [userId]),
      query(`SELECT score, badge FROM trust_scores WHERE user_id = $1`, [userId]),
      query(`SELECT flag FROM intent_flags WHERE user_id = $1 AND expires_at > NOW()`, [userId]),
      query(`SELECT state FROM presence WHERE user_id = $1 AND expires_at > NOW()`, [userId]),
    ]);

    if (profile.rows.length === 0) {
      res.status(404).json({ error: { message: 'User not found' } });
      return;
    }

    const p = profile.rows[0];
    res.json({
      data: {
        userId: p.user_id,
        displayName: p.display_name,
        bio: p.bio,
        gender: p.gender,
        sexuality: p.sexuality,
        age: p.age,
        photosJson: p.photos_json || [],
        verificationStatus: p.verification_status,
        verificationTier: p.verification_tier,
        experienceLevel: p.experience_level,
        isHost: p.is_host,
        kinks: p.kinks || [],
        showAsRole: p.show_as_role,
        showAsRelationship: p.show_as_relationship,
        joinedAt: p.joined_at,
        references: { total: parseInt(refs.rows[0].total), avgRating: parseFloat(refs.rows[0].avg_rating) || 0 },
        trustScore: trust.rows[0] || null,
        activeIntents: intents.rows.map(r => r.flag),
        presenceState: presence.rows[0]?.state || null,
      },
    });
  } catch (err) { next(err); }
});

router.post('/:id/like', authenticate, requireTier(1), controller.likeUser);
router.post('/:id/pass', authenticate, controller.passUser);
router.post('/:id/block', authenticate, controller.blockUser);
router.post('/:id/report', authenticate, validate(reportSchema), controller.reportUser);

export default router;
