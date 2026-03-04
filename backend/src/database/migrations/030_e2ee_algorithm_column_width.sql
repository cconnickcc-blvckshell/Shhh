-- Fix: algorithm column too short for default value 'x25519-xsalsa20-poly1305' (26 chars vs varchar(20))
ALTER TABLE user_keys ALTER COLUMN algorithm TYPE VARCHAR(50);
