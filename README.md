# 🎓 Campus Event Management System (Backend)

A production-ready, highly reliable backend for managing campus events, built using Node.js, Express, and PostgreSQL. Features role-based access control (RBAC), secure JWT authentication with refresh token rotation, Google OAuth 2.0 integration, email verification, and transaction-safe event registration.

---

![Dashboard Preview](https://github.com/user-attachments/assets/0dbcc529-b142-477f-9e45-32c8490fa1cd)

---

## 🏗️ Architecture

The backend follows a clean, decoupled MVC (Model-View-Controller) structure optimized for scalability, testability, and data security:

```mermaid
graph TD
    Client[Client / Mobile / Web] -->|HTTP Request| Router[Express Router]
    Router -->|1. Authenticate| AuthMiddleware[requireAuth Middleware]
    Router -->|2. Validate Input| Validator[Express Validator]
    Router -->|3. Delegate| Controller[Controllers]
    Controller -->|4. Query / Transact| Model[Models / Database Operations]
    Model -->|5. SQL| DB[(PostgreSQL)]
```

### Key Architectural Concepts:
- **Stateless JWT Auth**: High-speed authentication via short-lived JWT access tokens passed in `Authorization` headers.
- **Refresh Token Rotation (RTR)**: Long-lived refresh tokens stored securely in `HttpOnly`, `SameSite` cookies (with body-based fallback for mobile clients). Every refresh rotates both the access and refresh token, immediately revoking compromised tokens.
- **Transaction-Safe Registrations**: Leverages PostgreSQL database transactions and row-level locking (`SELECT ... FOR UPDATE`) to guarantee zero overbooking/race conditions during high-volume event registration.
- **Strict Separation of Concerns**: Routes handle HTTP methods, Validators sanitize inputs, Middlewares enforce authentication/roles, Controllers orchestrate business logic, and Models encapsulate SQL operations.

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

### 1. Clone the Repository
```bash
git clone https://github.com/rajveerpathak1/Campus-Event-Management-System.git
cd Campus-Event-Management-System
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
NODE_ENV=development

# Database Connection
DATABASE_URL=postgresql://username:password@localhost:5432/campus_events

# JWT Secrets
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_REFRESH_EXPIRY=7d

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/oauth/google/callback

# Client Web App URL
CLIENT_URL=http://localhost:3000

# Email Integration (Resend API)
RESEND_API_KEY=your_resend_api_key
```

### 4. Run Database Migrations & Seeds
Initialize database tables, schemas, constraints, and indexes, then seed the default super-admin user:
```bash
# Run migrations
node db/migrate.js

# Seed default Super Admin (admin@gmail.com / Admin123!)
node db/seedSuperAdmin.js
```

### 5. Run Server
```bash
# Production mode
npm start

# Development mode (with nodemon reload)
npm run dev
```

---

## 🗄️ Database Schema & Constraints

Our database design utilizes strict PostgreSQL checks, foreign keys, cascading deletes, and optimized indexes to ensure maximum performance and relational integrity.

```mermaid
erDiagram
    users ||--o{ registrations : "registers"
    users ||--o{ oauth_accounts : "links"
    users ||--o{ refresh_tokens : "owns"
    users ||--o{ email_verification_tokens : "owns"
    users ||--o{ password_reset_tokens : "owns"
    events ||--o{ registrations : "has"
```

### 1. `users` Table
Stores user credentials and roles.
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR(255) NOT NULL)
- `email` (VARCHAR(255) NOT NULL UNIQUE)
- `password_hash` (TEXT NULL) - Nullable to support passwordless Google OAuth logins.
- `role` (user_role ENUM: `'student'`, `'admin'`, `'super-admin'`)
- `is_active` (BOOLEAN NOT NULL DEFAULT TRUE)
- `email_verified_at` (TIMESTAMPTZ NULL)
- `last_login` (TIMESTAMPTZ NULL)
- `created_at` / `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())

**Constraints & Indexes:**
- CHECK (role IN ('student', 'admin', 'super-admin'))
- UNIQUE INDEX `idx_users_email_lower` on `LOWER(email)`

---

### 2. `events` Table
Stores details of events managed by administrators.
- `id` (SERIAL PRIMARY KEY)
- `title` (VARCHAR(255) NOT NULL)
- `description` (TEXT)
- `event_date` (TIMESTAMPTZ NOT NULL)
- `capacity` (INTEGER NOT NULL CHECK (capacity >= 0))
- `status` (VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')))
- `is_deleted` (BOOLEAN NOT NULL DEFAULT FALSE) - Facilitates soft deletion.
- `created_at` / `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())

**Constraints & Indexes:**
- CHECK (capacity >= 0)
- CHECK (status IN ('draft', 'published', 'cancelled'))
- INDEX `events_event_date_idx` on `event_date DESC`

---

### 3. `registrations` Table
Maps students to events using a transactional row lock.
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER REFERENCES users(id) ON DELETE CASCADE)
- `event_id` (INTEGER REFERENCES events(id) ON DELETE CASCADE)
- `created_at` / `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())

**Constraints & Indexes:**
- UNIQUE(user_id, event_id) - Prevents double registration.
- INDEX `registrations_event_id_idx` on `event_id`

---

### 4. `refresh_tokens` Table
Tracks active sessions and rotated refresh hashes.
- `id` (UUID PRIMARY KEY DEFAULT gen_random_uuid())
- `user_id` (BIGINT REFERENCES users(id) ON DELETE CASCADE)
- `token_hash` (TEXT NOT NULL UNIQUE)
- `device_id` (UUID NOT NULL)
- `device_name` (VARCHAR(150))
- `user_agent` (TEXT)
- `ip_address` (INET)
- `expires_at` (TIMESTAMPTZ NOT NULL)
- `revoked_at` (TIMESTAMPTZ NULL)
- `created_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())

---

### 5. `oauth_accounts` Table
Stores provider-specific details for connected external accounts.
- `id` (UUID PRIMARY KEY DEFAULT gen_random_uuid())
- `user_id` (BIGINT REFERENCES users(id) ON DELETE CASCADE)
- `provider` (oauth_provider ENUM: `'local'`, `'google'`, `'github'`)
- `provider_user_id` (VARCHAR(255) NOT NULL)
- `created_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())

---

### 6. `email_verification_tokens` & `password_reset_tokens`
Manage lifecycle parameters for secure transaction links.
- `id` (UUID PRIMARY KEY DEFAULT gen_random_uuid())
- `user_id` (BIGINT REFERENCES users(id) ON DELETE CASCADE UNIQUE)
- `token_hash` (TEXT NOT NULL UNIQUE)
- `expires_at` (TIMESTAMPTZ NOT NULL)
- `created_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())

---

## 🔒 Security & Concurrency Control

### Overbooking Protection (DB Row Lock)
To guarantee data consistency when 100+ students click "Register" at the same moment:
1. Begins a database transaction.
2. Performs a `SELECT capacity, status FROM events WHERE id = $1 FOR UPDATE` which locks the event row.
3. Queries the current registration count.
4. Checks if registrations exceed capacity. If valid, inserts a new registration row, else rolls back.

```sql
-- Conceptual Lock Flow
BEGIN;
SELECT capacity FROM events WHERE id = 123 FOR UPDATE;
-- Check capacity vs SELECT COUNT(*) FROM registrations WHERE event_id = 123;
INSERT INTO registrations (user_id, event_id) VALUES (45, 123);
COMMIT;
```

---

## 📄 API Documentation (Swagger)

Swagger API documentation is served interactively on deployed running servers at:
👉 **[click here](https://campus-event-management-system-lhpe.onrender.com/api-docs)**

Includes request and response examples for all authentication, OAuth, event search, registration, and administrative workflows.

---

## 🧪 Testing

We use the native Node.js test runner for fast, high-performance integration tests.
```bash
# Run all tests
npm test
```

---

## 👨‍💻 Author
- **Rajveer Pathak**
- NIT Kurukshetra
