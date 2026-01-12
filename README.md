# Campus Event Management System (Backend)

A backend system for managing campus events with role-based access control and session-based authentication.
The project is designed following the MVC architecture and focuses on clean backend practices, scalability, and real-world business logic.

This project is currently implemented using **Node.js, Express.js, PostgreSQL, and session-based authentication**, and will be continuously upgraded as new backend concepts are learned and applied.

---

## Project Objectives

* Build a production-style backend using Node.js and Express
* Implement session-based authentication instead of token-based auth
* Design a normalized relational database schema
* Enforce role-based authorization (Student vs Admin)
* Practice MVC architecture and middleware design
* Handle real-world edge cases like capacity limits and duplicate registrations

---

## Tech Stack

### Current

* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: PostgreSQL
* **Authentication**: Session-based authentication (`express-session`)
* **Architecture**: MVC (Model–View–Controller)
* **Environment Management**: dotenv

### Planned Upgrades

* Persistent session store (PostgreSQL / Redis)
* Rate limiting and security middlewares
* Request validation layer
* Pagination and filtering
* Logging and monitoring
* Testing (unit + integration)
* API documentation
* Deployment and production configuration

---

## System Overview

The system supports two user roles:

### Student

* Register and log in
* View available events
* Register for events
* Log out

### Admin

* Log in
* Create events
* Update events
* Delete events
* View all event registrations

Access to routes is controlled using middleware based on authentication and user roles.

---

## Project Structure

```
Campus-Event-Management-System/
│
├── config/
│   ├── db.js               # Database connection
│   └── session.js          # Session configuration
│
├── controllers/
│   ├── authController.js
│   ├── eventController.js
│   └── adminController.js
│
├── middlewares/
│   ├── authMiddleware.js   # Authentication checks
│   └── roleMiddleware.js   # Role-based authorization
│
├── models/
│   ├── userModel.js
│   ├── eventModel.js
│   └── registrationModel.js
│
├── routes/
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   └── adminRoutes.js
│
├── app.js                  # Express app configuration
├── server.js               # Server bootstrap
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## Architecture

The project follows the **MVC pattern**:

* **Models**
  Handle all database interactions and queries.

* **Controllers**
  Contain business logic and request handling.

* **Routes**
  Define API endpoints and map them to controllers.

* **Middlewares**
  Handle authentication, authorization, and request validation logic.

This separation ensures maintainability, scalability, and testability.

---

## Database Design

### Users

* Stores both students and admins
* Role determines access permissions

### Events

* Created and managed by admins
* Each event has a limited capacity

### Registrations

* Junction table implementing a many-to-many relationship
* Prevents duplicate registrations using unique constraints

The database is designed to be normalized and enforce integrity at the schema level.

---

## Authentication & Authorization

* Authentication is handled using **sessions**
* On successful login, user details are stored in the session
* Protected routes require a valid session
* Role-based middleware ensures only authorized users can access certain endpoints

This approach reflects traditional backend authentication patterns used in many enterprise systems.

---

## API Overview

### Authentication

```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /auth/me
```

### Events (Student)

```
GET    /events
POST   /events/:id/register
```

### Admin

```
POST   /admin/events
PUT    /admin/events/:id
DELETE /admin/events/:id
GET    /admin/registrations
```

---

## Key Business Rules

* A user cannot register for the same event more than once
* Event capacity cannot be exceeded
* Only admins can create, update, or delete events
* Unauthorized access returns appropriate HTTP status codes
* Session expiration invalidates access to protected routes

---

## Environment Variables

Create a `.env` file with the following variables:

```
PORT=5000
SESSION_SECRET=your_secret_key
```

---

## Development Status

This project is actively evolving.
As new backend concepts are learned, the system will be refactored and enhanced to reflect industry-grade practices.

---

## Author

**Rajveer Pathak**
* Backend & Data Science Enthusiast
* MATHEMATICS AND COMPUTING -2027
* NIT KURUKSHETRA
