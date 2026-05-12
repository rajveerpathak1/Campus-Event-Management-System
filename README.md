# 🎓 Campus Event Management System (Backend)

## 🚀 Overview
A production-ready backend system for managing campus events with role-based access control (RBAC), transaction-safe registrations, and scalable architecture.

This system supports students, admins, and super-admins with different access levels and ensures data integrity using PostgreSQL and database constraints.

---
<img width="1910" height="891" alt="image" src="https://github.com/user-attachments/assets/0dbcc529-b142-477f-9e45-32c8490fa1cd" />

## 🧠 Key Features

### 🔐 Authentication & Authorization
- Session-based authentication using `express-session`
- Role-Based Access Control (RBAC):
  - Student
  - Admin
  - Super Admin
- Secure password hashing using `bcrypt`

---

### 🎯 Event Management
- Admins can:
  - Create events (default: draft)
  - Update event details
  - Publish / unpublish events
  - Cancel events
  - Soft delete events
- Event lifecycle:
  -Draft → Published → Cancelled



---

### 🎓 Student Features
- Browse events with:
  - Search
  - Pagination
- Register / Unregister for events
- View personal registrations

---

### ⚡ Registration System (High Reliability)
- Transaction-safe registration using PostgreSQL
- Uses row-level locking (`FOR UPDATE`)
- Prevents:
- Overbooking (capacity overflow)
- Duplicate registrations

---

### 👑 Super Admin Features
- Promote users to admin
- Demote admins to student
- Delete users safely (handles dependencies)

---

## 🏗️ Architecture

- MVC Pattern:
  - Controllers
  - Models
  - Routes
  - Middleware-based request handling

- RESTful API design
- Separation of concerns for scalability

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- PostgreSQL
- pg (node-postgres)
- express-session
- connect-pg-simple
- bcrypt
- Swagger (API documentation)
- Winston (logging)
- Morgan (request logging)

---

## 🗄️ Database Design

### 📌 Tables Overview

#### 1. Users
| Column   | Type        | Description                  |
|----------|------------|------------------------------|
| id       | SERIAL     | Primary Key                  |
| name     | TEXT       | User name                    |
| email    | TEXT       | Unique email                 |
| password | TEXT       | Hashed password              |
| role     | TEXT       | student / admin / super-admin |

---

#### 2. Events
| Column      | Type        | Description                  |
|------------|------------|------------------------------|
| id          | SERIAL     | Primary Key                  |
| title       | TEXT       | Event title                  |
| description | TEXT       | Event description            |
| event_date  | TIMESTAMP  | Event date                   |
| capacity    | INTEGER    | Max participants             |
| status      | TEXT       | draft / published / cancelled |
| is_deleted  | BOOLEAN    | Soft delete flag             |

---

#### 3. Registrations
| Column     | Type       | Description                      |
|-----------|-----------|----------------------------------|
| id         | SERIAL    | Primary Key                      |
| user_id    | INTEGER   | FK → users(id)                  |
| event_id   | INTEGER   | FK → events(id)                 |
| created_at | TIMESTAMP | Registration timestamp          |

---

## 🔗 Relationships
 -Users (1) ──────── (M) Registrations (M) ──────── (1) Events



### Foreign Keys
- `registrations.user_id → users.id`
- `registrations.event_id → events.id`

---

## 🔒 Constraints

- Unique constraint:
   -  UNIQUE(user_id, event_id)
   -  → prevents duplicate registrations

- Role constraint:
  -CHECK (role IN ('student', 'admin', 'super-admin'))


- Event status constraint:
  -CHECK (status IN ('draft', 'published', 'cancelled'))



---

## 🧪 Testing

- Integration testing using Node.js test runner
- Real HTTP requests (no mocks)
- Covers:
- Authentication flow
- RBAC enforcement
- Admin workflows
- Registration flow

---

## 📄 API Documentation

Swagger UI available at:
 - http://localhost:5000/api-docs


Features:
- Interactive API testing
- Organized endpoints (Auth, Events, Admin, etc.)

---

## 📊 Logging

- Winston-based structured logging
- Logs:
  - Requests (via Morgan)
  - Errors
  - System events

Log files:
  -logs/combined.log
  -logs/error.log



---

## 🔐 Security Features

- Helmet for HTTP security headers
- Rate limiting
- Secure cookies:
  - httpOnly
  - sameSite
  - secure (production)
- Input validation
- Password hashing

---

## 🚀 Setup & Installation

```bash
# Clone repository
git clone https://github.com/rajveerpathak1/Campus-Event-Management-System.git

# Install dependencies
npm install

# Create .env file
PORT=5000
DATABASE_URL=your_db_url
SESSION_SECRET=your_secret

# Run server
npm run dev


```


---
🌐 Deployment
- Deployed on Render : https://campus-event-management-system-lhpe.onrender.com
- Frontend on Vercel : https://cem-frontend-three.vercel.app
- Environment-based configuration

---

🧠 Key Learnings
- Designing scalable backend systems
- Handling concurrency with DB transactions
- Implementing RBAC correctly
- Writing integration tests for real-world systems
- Maintaining consistency between DB constraints and application logic

---

📌 Future Improvements
- Event ownership (created_by)
- Waitlist system
- Notifications (email/SMS)
- Event image uploads
- Frontend integration

---

👨‍💻 Author

- Rajveer Pathak
- B.Tech Mathematics & Computing
- NIT Kurukshetra
