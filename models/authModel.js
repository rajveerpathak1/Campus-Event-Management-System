const { getDB } = require("../config/db");

/* ============================================================
   CREATE USER
============================================================ */

const createUser = async ({
  name,
  email,
  passwordHash,
  role = "student",
}) => {

  const db = getDB();

  const result = await db.query(
    `
    INSERT INTO users
    (
        name,
        email,
        password_hash,
        role
    )

    VALUES
    (
        $1,
        $2,
        $3,
        $4
    )

    RETURNING *
    `,
    [
      name,
      email.toLowerCase(),
      passwordHash,
      role,
    ]
  );

  return result.rows[0];
};

/* ============================================================
   FIND USER BY EMAIL
============================================================ */

const findUserByEmail = async (email) => {

  const db = getDB();

  const result = await db.query(
    `
    SELECT *

    FROM users

    WHERE email = $1

    LIMIT 1
    `,
    [email.toLowerCase()]
  );

  return result.rows[0] || null;
};

/* ============================================================
   FIND USER BY ID
============================================================ */

const findUserById = async (id) => {

  const db = getDB();

  const result = await db.query(
    `
    SELECT *

    FROM users

    WHERE id = $1

    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
};

/* ============================================================
   UPDATE LAST LOGIN
============================================================ */

const updateLastLogin = async (userId) => {

  const db = getDB();

  await db.query(
    `
    UPDATE users

    SET
        last_login = NOW(),
        updated_at = NOW()

    WHERE id = $1
    `,
    [userId]
  );
};


/* ============================================================
   STORE REFRESH TOKEN
============================================================ */

const storeRefreshToken = async ({
  userId,
  tokenHash,
  deviceId,
  deviceName,
  userAgent,
  ipAddress,
  expiresAt,
}) => {

  const db = getDB();

  const result = await db.query(
    `
    INSERT INTO refresh_tokens
    (
        user_id,
        token_hash,
        device_id,
        device_name,
        user_agent,
        ip_address,
        expires_at
    )

    VALUES
    (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7
    )

    RETURNING *
    `,
    [
      userId,
      tokenHash,
      deviceId,
      deviceName,
      userAgent,
      ipAddress,
      expiresAt,
    ]
  );

  return result.rows[0];
};

/* ============================================================
   FIND REFRESH TOKEN
============================================================ */

const findRefreshToken = async (
  tokenHash
) => {

  const db = getDB();

  const result = await db.query(
    `
    SELECT *

    FROM refresh_tokens

    WHERE token_hash = $1

      AND revoked_at IS NULL

      AND expires_at > NOW()

    LIMIT 1
    `,
    [tokenHash]
  );

  return result.rows[0] || null;
};

/* ============================================================
   REVOKE REFRESH TOKEN
============================================================ */

const revokeRefreshToken = async (
  id
) => {

  const db = getDB();

  await db.query(
    `
    UPDATE refresh_tokens

    SET revoked_at = NOW()

    WHERE id = $1
    `,
    [id]
  );
};

/* ============================================================
   REVOKE ALL USER TOKENS
============================================================ */

const revokeAllRefreshTokens =
async (userId) => {

  const db = getDB();

  await db.query(
    `
    UPDATE refresh_tokens

    SET revoked_at = NOW()

    WHERE user_id = $1

      AND revoked_at IS NULL
    `,
    [userId]
  );
};



/* ============================================================
   STORE EMAIL VERIFICATION TOKEN
============================================================ */

const storeVerificationToken = async ({
  userId,
  tokenHash,
  expiresAt,
}) => {

  const db = getDB();

  const result = await db.query(
    `
    INSERT INTO email_verification_tokens
    (
        user_id,
        token_hash,
        expires_at
    )

    VALUES
    (
        $1,
        $2,
        $3
    )

    ON CONFLICT (user_id)

    DO UPDATE

    SET
        token_hash = EXCLUDED.token_hash,

        expires_at = EXCLUDED.expires_at,

        created_at = NOW()

    RETURNING *
    `,
    [
      userId,
      tokenHash,
      expiresAt,
    ]
  );

  return result.rows[0];
};

/* ============================================================
   FIND EMAIL VERIFICATION TOKEN
============================================================ */

const findVerificationToken = async (
  tokenHash
) => {

  const db = getDB();

  const result = await db.query(
    `
    SELECT *

    FROM email_verification_tokens

    WHERE token_hash = $1

      AND expires_at > NOW()

    LIMIT 1
    `,
    [tokenHash]
  );

  return result.rows[0] || null;
};

/* ============================================================
   DELETE EMAIL VERIFICATION TOKEN
============================================================ */

const deleteVerificationToken =
async (userId) => {

  const db = getDB();

  await db.query(
    `
    DELETE FROM email_verification_tokens

    WHERE user_id = $1
    `,
    [userId]
  );
};


/* ============================================================
   STORE PASSWORD RESET TOKEN
============================================================ */

const storePasswordResetToken = async ({
  userId,
  tokenHash,
  expiresAt,
}) => {

  const db = getDB();

  const result = await db.query(
    `
    INSERT INTO password_reset_tokens
    (
        user_id,
        token_hash,
        expires_at
    )

    VALUES
    (
        $1,
        $2,
        $3
    )

    ON CONFLICT (user_id)

    DO UPDATE

    SET
        token_hash = EXCLUDED.token_hash,

        expires_at = EXCLUDED.expires_at,

        created_at = NOW()

    RETURNING *
    `,
    [
      userId,
      tokenHash,
      expiresAt,
    ]
  );

  return result.rows[0];
};

/* ============================================================
   FIND PASSWORD RESET TOKEN
============================================================ */

const findPasswordResetToken =
async (tokenHash) => {

  const db = getDB();

  const result = await db.query(
    `
    SELECT *

    FROM password_reset_tokens

    WHERE token_hash = $1

      AND expires_at > NOW()

      AND used_at IS NULL

    LIMIT 1
    `,
    [tokenHash]
  );

  return result.rows[0] || null;
};

/* ============================================================
   MARK PASSWORD RESET TOKEN USED
============================================================ */

const markPasswordResetTokenUsed = async (userId) => {

  const db = getDB();

  await db.query(
    `
    UPDATE password_reset_tokens

    SET used_at = NOW()

    WHERE user_id = $1
    `,
    [userId]
  );
};

/* ============================================================
   FIND OAUTH ACCOUNT
============================================================ */

const findOAuthAccount = async ({
  provider,
  providerUserId,
}) => {

  const db = getDB();

  const result = await db.query(
    `
    SELECT *

    FROM oauth_accounts

    WHERE provider = $1

      AND provider_user_id = $2

    LIMIT 1
    `,
    [
      provider,
      providerUserId,
    ]
  );

  return result.rows[0] || null;
};

/* ============================================================
   LINK OAUTH ACCOUNT
============================================================ */

const linkOAuthAccount = async ({
  userId,
  provider,
  providerUserId,
}) => {

  const db = getDB();

  const result = await db.query(
    `
    INSERT INTO oauth_accounts
    (
        user_id,
        provider,
        provider_user_id
    )

    VALUES
    (
        $1,
        $2,
        $3
    )

    RETURNING *
    `,
    [
      userId,
      provider,
      providerUserId,
    ]
  );

  return result.rows[0];
};

/* ============================================================
   MARK EMAIL VERIFIED
============================================================ */

const markEmailVerified = async (userId) => {

    const db = getDB();

    const result = await db.query(
        `
        UPDATE users

        SET

            email_verified_at = NOW(),

            updated_at = NOW()

        WHERE id = $1

        RETURNING *
        `,
        [userId]
    );

    return result.rows[0] || null;

};


/* ============================================================
   UPDATE PASSWORD
============================================================ */

const updatePassword = async ({
    userId,
    passwordHash,
}) => {

    const db = getDB();

    const result = await db.query(
        `
        UPDATE users

        SET

            password_hash = $2,

            updated_at = NOW()

        WHERE id = $1

        RETURNING *
        `,
        [
            userId,
            passwordHash,
        ]
    );

    return result.rows[0] || null;

};


/* ============================================================
   REVOKE REFRESH TOKEN BY HASH
============================================================ */

const revokeRefreshTokenByHash = async (
    tokenHash
) => {

    const db = getDB();

    await db.query(
        `
        UPDATE refresh_tokens

        SET revoked_at = NOW()

        WHERE token_hash = $1

        `,
        [tokenHash]
    );

};


/* ============================================================
   DELETE EXPIRED TOKENS
============================================================ */

const deleteExpiredRefreshTokens =
async () => {

    const db = getDB();

    await db.query(
        `
        DELETE

        FROM refresh_tokens

        WHERE expires_at < NOW()
        `
    );

};



/* ============================================================
   DELETE EXPIRED VERIFICATION TOKENS
============================================================ */

const deleteExpiredVerificationTokens =
async () => {

    const db = getDB();

    await db.query(
        `
        DELETE

        FROM email_verification_tokens

        WHERE expires_at < NOW()
        `
    );

};


/* ============================================================
   DELETE EXPIRED PASSWORD TOKENS
============================================================ */

const deleteExpiredPasswordResetTokens =
async () => {

    const db = getDB();

    await db.query(
        `
        DELETE

        FROM password_reset_tokens

        WHERE expires_at < NOW()
        `
    );

};

/* ============================================================
   FIND VERIFICATION TOKEN WITH USER
============================================================ */

const findVerificationTokenWithUser =
async (tokenHash) => {

    const db = getDB();

    const result = await db.query(
        `
        SELECT

            evt.user_id,

            u.id,

            u.name,

            u.email,

            u.role,

            u.email_verified_at

        FROM email_verification_tokens evt

        JOIN users u

            ON u.id = evt.user_id

        WHERE evt.token_hash = $1

        AND evt.expires_at > NOW()

        LIMIT 1
        `,
        [tokenHash]
    );

    return result.rows[0] || null;

};


/* ============================================================
   FIND REFRESH TOKEN WITH USER
============================================================ */

const findRefreshTokenWithUser =
async (tokenHash) => {

    const db = getDB();

    const result = await db.query(
        `
        SELECT

            rt.id AS refresh_token_id,

            rt.user_id,

            rt.token_hash,

            rt.expires_at,

            rt.revoked_at,
            rt.device_id,
rt.device_name,
rt.user_agent,
rt.ip_address,

            u.id,

            u.name,

            u.email,

            u.role,

            u.email_verified_at

        FROM refresh_tokens rt

        JOIN users u

            ON u.id = rt.user_id

        WHERE rt.token_hash = $1
        AND rt.revoked_at IS NULL
        AND rt.expires_at > NOW()
        LIMIT 1
        `,
        [tokenHash]
    );

    return result.rows[0] || null;

};



module.exports = {

    // Users

    createUser,

    findUserByEmail,

    findUserById,

    updateLastLogin,

    markEmailVerified,

    // Refresh

    storeRefreshToken,

    findRefreshToken,

    revokeRefreshToken,

    revokeAllRefreshTokens,

    // Verification

    storeVerificationToken,

    findVerificationToken,

    deleteVerificationToken,

    // Password Reset

    storePasswordResetToken,

    findPasswordResetToken,

    markPasswordResetTokenUsed,

    // OAuth

    findOAuthAccount,

    linkOAuthAccount,
    
    updatePassword,


    revokeRefreshTokenByHash,

deleteExpiredRefreshTokens,

deleteExpiredVerificationTokens,

deleteExpiredPasswordResetTokens,

findVerificationTokenWithUser,

findRefreshTokenWithUser

};