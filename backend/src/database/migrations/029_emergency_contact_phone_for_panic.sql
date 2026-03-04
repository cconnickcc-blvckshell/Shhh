-- Store contact phone for panic notifications (SMS). User explicitly provides for emergency use only.
-- phone_hash retained for deduplication; phone used only server-side when panic triggered.
ALTER TABLE emergency_contacts ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

COMMENT ON COLUMN emergency_contacts.phone IS 'Contact phone for emergency SMS. Used only when panic triggered. User consents on add.';
