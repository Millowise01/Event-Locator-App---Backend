# Event Locator App — Backend

A multi-user event locator backend built with Node.js, PostgreSQL/PostGIS, Redis Pub/Sub, and i18next. Users can discover events by location and preferences, receive notifications, and interact with events through ratings, favorites, and registrations.

---

## Table of Contents

- [Project Setup](#project-setup)
- [API Endpoints](#api-endpoints)
- [Technical Choices](#technical-choices)
- [Database Schema](#database-schema)
- [Challenges and Solutions](#challenges-and-solutions)

---

## Project Setup

### Prerequisites

- Node.js v18+
- PostgreSQL 14+ with PostGIS extension
- Redis 6+

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd Event-Locator-App---Backend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your database and Redis credentials

# 4. Set up PostgreSQL database
psql -U postgres -c "CREATE DATABASE event_locator;"

# 5. Run migrations (creates tables, enables PostGIS, seeds categories)
npm run migrate

# 6. Start the server
npm run dev        # development (nodemon)
npm start          # production
```

### Running Tests

```bash
npm test              # unit tests only
npm run test:all      # unit + integration tests
npm run test:coverage # with coverage report
```

---

## API Endpoints

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register new user |
| POST | `/login` | No | Login and receive JWT |
| GET | `/me` | Yes | Get current user profile |
| PUT | `/profile` | Yes | Update profile (name, language) |
| PUT | `/location` | Yes | Update user location (lat/lng) |
| POST | `/change-password` | Yes | Change password |

### Events — `/api/events`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Yes | Create event |
| GET | `/` | Yes | Get user's created events |
| GET | `/:id` | No | Get event by ID |
| PUT | `/:id` | Yes | Update event (creator only) |
| DELETE | `/:id` | Yes | Soft-delete event (creator only) |
| POST | `/search/location` | No | Search events by radius + category |
| GET | `/search?q=` | No | Text search with category filter |

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/preferences` | Yes | Get preferences + preferred categories |
| PUT | `/preferences` | Yes | Update search radius, notifications |
| POST | `/categories` | Yes | Set preferred event categories |
| POST | `/favorites/:eventId` | Yes | Add event to favorites |
| DELETE | `/favorites/:eventId` | Yes | Remove from favorites |
| GET | `/favorites` | Yes | List favorite events |
| GET | `/favorites/:eventId/check` | Yes | Check if event is favorited |
| POST | `/events/:eventId/register` | Yes | Register for event |
| DELETE | `/events/:eventId/unregister` | Yes | Unregister from event |
| GET | `/events/attending` | Yes | List events user is attending |

### Reviews — `/api/reviews`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/:eventId` | Yes | Create or update review (1–5 stars) |
| GET | `/:eventId` | No | Get reviews for event (paginated) |
| GET | `/:eventId/stats` | No | Rating distribution statistics |
| GET | `/:eventId/user` | Yes | Get current user's review |
| DELETE | `/:reviewId` | Yes | Delete review (author only) |
| GET | `/top-rated` | No | Top-rated events |

### Notifications — `/api/notifications`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | Get notifications (supports `?unreadOnly=true`) |
| GET | `/unread-count` | Yes | Get unread count |
| PUT | `/mark-all-read` | Yes | Mark all as read |
| PUT | `/:notificationId/read` | Yes | Mark single notification as read |

### Categories — `/api/categories`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | List all categories |
| GET | `/:id` | No | Get category by ID |

### Health — `/api/health`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

---

## Technical Choices

### PostgreSQL + PostGIS

PostgreSQL was chosen as the relational database for its robustness, ACID compliance, and the PostGIS extension which provides native geospatial types and functions. Key geospatial features used:

- `GEOGRAPHY(POINT, 4326)` — stores lat/lng using the WGS84 coordinate system (same as GPS)
- `ST_DWithin` — efficiently finds all events within a given radius in meters using spatial indexes
- `ST_DistanceSphere` — calculates accurate great-circle distances between points
- `ST_GeogFromText` / `ST_MakePoint` — constructs geography values from coordinates
- `GIST indexes` on location columns — enables fast spatial queries without full table scans

This approach is far more accurate and performant than bounding-box approximations or application-level Haversine filtering.

### Redis Pub/Sub

Redis was chosen for the notification queuing system because:

- **Pub/Sub** enables real-time push of notifications to connected clients per user channel (`user:{id}:notifications`)
- **Sorted Sets (ZADD)** with Unix timestamps as scores implement a delayed notification queue — notifications can be scheduled to fire closer to event start times
- It is lightweight, fast, and integrates cleanly with Node.js via the `redis` v4 client
- Graceful degradation: the app continues to function if Redis is unavailable, storing notifications in PostgreSQL only

### i18next

`i18next` with `i18next-http-middleware` was chosen for internationalization because:

- Language detection from `Accept-Language` headers is automatic
- Translations are organized by namespace and support interpolation (`{{count}} events found`)
- Four languages are supported: English (en), Spanish (es), French (fr), German (de)
- Users can set a `preferred_language` in their profile, and the API respects it

### Express.js

Express was chosen for its minimal footprint, large ecosystem, and straightforward middleware composition. `helmet` adds security headers, `cors` enables cross-origin requests, and `express-validator` handles input validation.

### JWT Authentication

JSON Web Tokens (signed with HS256) provide stateless authentication. Tokens expire after 7 days. `bcryptjs` with 10 salt rounds is used for password hashing — sufficient security without excessive CPU cost.

### Jest

Jest was selected as the testing framework for its zero-config setup, built-in mocking (`jest.mock`), and excellent async support. All database calls are mocked at the `pg-promise` level so unit tests run without a live database.

---

## Database Schema

The schema is fully normalized (3NF) with PostGIS geospatial support.

```
users
  id (UUID PK), email (UNIQUE), password_hash, first_name, last_name,
  phone, location (GEOGRAPHY POINT), preferred_language, is_active

user_preferences
  id (UUID PK), user_id (FK → users), search_radius_km,
  notification_enabled, newsletters_enabled

categories
  id (UUID PK), name (UNIQUE), description

events
  id (UUID PK), creator_id (FK → users), title, description,
  location (GEOGRAPHY POINT), address, city, country,
  start_date, end_date, max_attendees, current_attendees, is_active

event_categories          [junction: events ↔ categories]
event_attendees           [junction: events ↔ users, with status]
event_reviews             [user_id + event_id UNIQUE, rating 1–5]
favorite_events           [junction: users ↔ events]
user_category_preferences [junction: users ↔ categories]
notifications             [user_id FK, event_id FK, type, read]
```

Indexes:
- `GIST` indexes on `events.location` and `users.location` for spatial queries
- Standard B-tree indexes on foreign keys, email, dates, and notification read status

---

## Challenges and Solutions

### Challenge 1: Accurate Geospatial Distance Queries

**Problem:** Simple bounding-box queries (min/max lat/lng) are inaccurate near the poles and at large radii. Application-level Haversine filtering requires loading all events into memory first.

**Solution:** Used PostGIS `ST_DWithin` with the `GEOGRAPHY` type (not `GEOMETRY`). The `GEOGRAPHY` type operates in meters on a spherical Earth model, so `ST_DWithin(location, point, radius_meters)` is both accurate and index-accelerated via the GIST spatial index. Results are sorted by `ST_DistanceSphere` distance.

### Challenge 2: Redis Availability

**Problem:** The notification system depends on Redis, but Redis may not always be available in development or may fail at runtime.

**Solution:** The `NotificationService` wraps all Redis operations in try/catch and checks `this.initialized` before any publish/subscribe call. If Redis is unavailable, notifications are still persisted to PostgreSQL and the app continues running — Redis is treated as an enhancement, not a hard dependency.

### Challenge 3: Duplicate Middleware Files

**Problem:** `errorHandler.js` and `authMiddleware.js` contained duplicate content, and `authService.js` imported the database from a different path than all other services.

**Solution:** Standardized all database imports to use `../database/connection`. Rewrote `errorHandler.js` to contain only the global error handler and 404 handler. The single source of truth for JWT authentication is `authMiddleware.js`.

### Challenge 4: Notification Test Coverage

**Problem:** The notification service had no unit tests despite being a core deliverable.

**Solution:** Added `notificationService.test.js` with full mocking of both the `redis` client and `pg-promise` database, covering notification creation, retrieval, read-marking, unread counts, and the upcoming event notification broadcast.
