/* ============================================================
   Migration: 001_authentication_v2.sql
   Description:
   Upgrade authentication system from Express Session
   to JWT Authentication with Refresh Token Rotation.

   Changes:
   - Create authentication enums
   - Upgrade users table
   - Prepare for OAuth
   - Prepare for Email Verification
   - Prepare for Password Reset

   Author : Rajveer Pathak
   Version: 2.0
============================================================ */

BEGIN;

--------------------------------------------------------------
-- Enable required PostgreSQL extensions
--------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pgcrypto;

--------------------------------------------------------------
-- Create ENUM : user_role
--------------------------------------------------------------

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'user_role'
    ) THEN

        CREATE TYPE user_role AS ENUM (
            'student',
            'admin',
            'super-admin'
        );

    END IF;

END $$;

--------------------------------------------------------------
-- Create ENUM : oauth_provider
--------------------------------------------------------------

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'oauth_provider'
    ) THEN

        CREATE TYPE oauth_provider AS ENUM (
            'local',
            'google',
            'github'
        );

    END IF;

END $$;

--------------------------------------------------------------
-- USERS TABLE MIGRATION
--------------------------------------------------------------

--------------------------------------------------------------
-- Rename password -> password_hash
--------------------------------------------------------------

DO $$
BEGIN

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='users'
        AND column_name='password'
    )
    THEN

        ALTER TABLE users
        RENAME COLUMN password TO password_hash;

    END IF;

    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'admin', 'super-admin', 'superAdmin'));

END $$;

--------------------------------------------------------------
-- Add email_verified_at
--------------------------------------------------------------

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

--------------------------------------------------------------
-- Add is_active
--------------------------------------------------------------

ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_active BOOLEAN
NOT NULL
DEFAULT TRUE;

--------------------------------------------------------------
-- Add last_login
--------------------------------------------------------------

ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

--------------------------------------------------------------
-- Add deleted_at
--------------------------------------------------------------

ALTER TABLE users
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

--------------------------------------------------------------
-- Add avatar_url
--------------------------------------------------------------

ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

--------------------------------------------------------------
-- Convert role column to ENUM
--------------------------------------------------------------

ALTER TABLE users
ALTER COLUMN role TYPE user_role
USING role::user_role;

--------------------------------------------------------------
-- Make password_hash nullable
--------------------------------------------------------------

ALTER TABLE users
ALTER COLUMN password_hash DROP NOT NULL;

--------------------------------------------------------------
-- Update timestamps to TIMESTAMPTZ
--------------------------------------------------------------

ALTER TABLE users
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'UTC';

ALTER TABLE users
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'UTC';

--------------------------------------------------------------
-- Add constraints
--------------------------------------------------------------

ALTER TABLE users
ADD CONSTRAINT chk_users_email
CHECK (email <> '');

--------------------------------------------------------------
-- Indexes
--------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

CREATE INDEX IF NOT EXISTS idx_users_active
ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_users_verified
ON users(email_verified_at);


/* ============================================================
   OAUTH ACCOUNTS
============================================================ */

CREATE TABLE IF NOT EXISTS oauth_accounts (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id BIGINT NOT NULL,

    provider oauth_provider NOT NULL,

    provider_user_id VARCHAR(255) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    CONSTRAINT fk_oauth_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_provider_account
        UNIQUE(provider, provider_user_id)

);

CREATE INDEX IF NOT EXISTS idx_oauth_user
ON oauth_accounts(user_id);

--------------------------------------------------------------
-- REFRESH TOKENS
--------------------------------------------------------------

CREATE TABLE IF NOT EXISTS refresh_tokens (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id BIGINT NOT NULL,

    token_hash TEXT NOT NULL,

    device_id UUID NOT NULL,

    device_name VARCHAR(150),

    user_agent TEXT,

    ip_address INET,

    expires_at TIMESTAMPTZ NOT NULL,

    revoked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    CONSTRAINT fk_refresh_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);

CREATE INDEX IF NOT EXISTS idx_refresh_user
ON refresh_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_refresh_device
ON refresh_tokens(device_id);

CREATE INDEX IF NOT EXISTS idx_refresh_expiry
ON refresh_tokens(expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_hash
ON refresh_tokens(token_hash);

--------------------------------------------------------------
-- EMAIL VERIFICATION TOKENS
--------------------------------------------------------------

CREATE TABLE IF NOT EXISTS email_verification_tokens (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id BIGINT NOT NULL,

    token_hash TEXT NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    CONSTRAINT fk_email_verification_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verification_hash
ON email_verification_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_email_verification_user
ON email_verification_tokens(user_id);

--------------------------------------------------------------
-- PASSWORD RESET TOKENS
--------------------------------------------------------------

CREATE TABLE IF NOT EXISTS password_reset_tokens (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id BIGINT NOT NULL,

    token_hash TEXT NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    CONSTRAINT fk_password_reset_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);

CREATE UNIQUE INDEX IF NOT EXISTS idx_password_reset_hash
ON password_reset_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_password_reset_user
ON password_reset_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_expiry
ON password_reset_tokens(expires_at);

/* ============================================================
   ADDITIONAL CONSTRAINTS
============================================================ */

--------------------------------------------------------------
-- Only one active verification token per user
--------------------------------------------------------------

ALTER TABLE email_verification_tokens
ADD CONSTRAINT uq_email_verification_user
UNIQUE(user_id);

--------------------------------------------------------------
-- Only one active password reset token per user
--------------------------------------------------------------

ALTER TABLE password_reset_tokens
ADD CONSTRAINT uq_password_reset_user
UNIQUE(user_id);

--------------------------------------------------------------
-- Prevent duplicate OAuth accounts
--------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_unique
ON oauth_accounts(provider, provider_user_id);

--------------------------------------------------------------
-- One provider linked only once per user
--------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_user_provider
ON oauth_accounts(user_id, provider);

--------------------------------------------------------------
-- Email uniqueness (case insensitive)
--------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower
ON users(LOWER(email));


COMMIT;