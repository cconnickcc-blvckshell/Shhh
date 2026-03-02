import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { query } from '../config/database';

export type AdminRole = 'moderator' | 'admin' | 'superadmin';

const ROLE_HIERARCHY: Record<AdminRole, number> = {
  moderator: 1,
  admin: 2,
  superadmin: 3,
};

export function requireRole(minRole: AdminRole) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError(401, 'Authentication required'));
    }

    const result = await query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
    const userRole = result.rows[0]?.role || 'user';

    if (userRole === 'user' || !ROLE_HIERARCHY[userRole as AdminRole]) {
      return next(createError(403, 'Admin access required'));
    }

    const userLevel = ROLE_HIERARCHY[userRole as AdminRole];
    const requiredLevel = ROLE_HIERARCHY[minRole];

    if (userLevel < requiredLevel) {
      return next(createError(403, `${minRole} role or higher required`));
    }

    next();
  };
}

export async function logAdminAction(
  adminUserId: string,
  action: string,
  targetType: string,
  targetId: string,
  justification?: string
) {
  await query(
    `INSERT INTO admin_actions (admin_user_id, action, target_type, target_id, justification)
     VALUES ($1, $2, $3, $4, $5)`,
    [adminUserId, action, targetType, targetId, justification || null]
  );
}
