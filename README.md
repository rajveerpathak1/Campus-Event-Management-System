# Campus Event Management System (Backend)

## 🚀 Overview
A production-ready backend system for managing campus events with role-based access control, transaction-safe registrations, and scalable architecture.

---

## 🧠 Key Features

### 🔐 Authentication & Authorization
- Session-based authentication
- Role-based access control (Student, Admin, Super Admin)
- Secure password hashing using bcrypt

### 🎯 Event Management
- Admins can create, update, publish, cancel events
- Event lifecycle: Draft → Published → Cancelled
- Soft delete support

### 🎓 Student Features
- Browse events with search & pagination
- Register/unregister for events
- View personal registrations

### 👑 Super Admin Features
- Promote/demote users
- Delete users safely (handles dependencies)

### ⚡ Registration System
- Transaction-safe registration
- Row-level locking (FOR UPDATE)
- Prevents overbooking
- Prevents duplicate registrations

---

## 🏗️ Architecture

- MVC Pattern (Controllers, Models, Routes)
- Middleware-based request handling
- PostgreSQL database with constraints
- RESTful API design

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

---

## 🔍 Database Design

### Users
- id, name, email, password, role

### Events
- id, title, description, event_date, capacity, status

### Registrations
- id, user_id, event_id

---

## 🧪 Testing

- Integration testing using Node test runner
- Real HTTP request testing
- Covers:
  - Authentication flow
  - RBAC (role-based access control)
  - Admin workflows
  - Registration flow

---

## 🔐 Security

- Helmet for HTTP security headers
- Rate limiting
- Secure cookies (httpOnly, sameSite, secure)
- Input validation
- Password hashing

---

## 📊 Logging

- Winston-based structured logging
- Error tracking
- Request logging via Morgan

---

## 📄 API Documentation

- Swagger UI available at `/api-docs`
- Interactive API testing

---

## 🚀 Deployment

- Deployed on Render
- Environment-based configuration

---

## 🧠 Key Learnings

- Designing scalable backend systems
- Handling concurrency with database transactions
- Implementing role-based access control
- Writing integration tests for real-world scenarios
- Maintaining consistency between application logic and database constraints

---

## 📌 Future Improvements

- Event ownership
- Waitlist system
- Notifications (email/SMS)
- File uploads (event images)
- Frontend integration

---

## 👨‍💻 Author
Rajveer Pathak