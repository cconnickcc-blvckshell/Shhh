-- Admin RBAC: explicit role field, decoupled from verification tier
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'
    CHECK (role IN ('user', 'moderator', 'admin', 'superadmin'));

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE role != 'user';

-- Admin action audit (who did what, with justification)
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(30),
    target_id UUID,
    justification TEXT,
    reversible BOOLEAN DEFAULT true,
    reversed_at TIMESTAMPTZ,
    reversed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_id);

-- Phone hash pepper (stored in DB so it can be rotated, but should also be in env)
-- The actual pepper value should be set in PHONE_HASH_PEPPER env var
