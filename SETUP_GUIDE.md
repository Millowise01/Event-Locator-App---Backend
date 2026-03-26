# Event Locator App — Complete Setup & Testing Guide

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Installation & Setup](#2-installation--setup)
3. [Environment Configuration](#3-environment-configuration)
4. [Database Setup & Connection](#4-database-setup--connection)
5. [pgAdmin — Database Verification](#5-pgadmin--database-verification)
6. [Running the Server](#6-running-the-server)
7. [Running Tests](#7-running-tests)
8. [API Testing Guide](#8-api-testing-guide)
9. [i18n Language Testing](#9-i18n-language-testing)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. System Requirements

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | v18+ | Runtime |
| npm | v9+ | Package manager |
| PostgreSQL | v14+ | Primary database |
| PostGIS | v3+ | Geospatial extension |
| Redis | v6+ | Notification queue (optional) |
| pgAdmin | v4+ | Database GUI |
| Postman | Any | API testing |

---

## 2. Installation & Setup

### Step 1 — Clone the repository

```bash
git clone <repository-url>
cd Event-Locator-App---Backend
```

### Step 2 — Install dependencies

```bash
npm install
```

Verify all packages installed:

```bash
npm list --depth=0
```

You should see: `bcryptjs`, `cors`, `dotenv`, `express`, `express-validator`, `helmet`, `i18next`, `i18next-http-middleware`, `jsonwebtoken`, `pg-promise`, `redis`, `uuid`, `winston`

---

## 3. Environment Configuration

### Step 1 — Create your .env file

Copy the example file:

```bash
copy .env.example .env
```

### Step 2 — Edit .env with your values

Open `.env` and fill in:

```env
# Application
NODE_ENV=development
PORT=3000

# Database (PostgreSQL + PostGIS)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event_locator
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# JWT Authentication
JWT_SECRET=super-secret-jwt-key-minimum-32-characters-long

# Redis (optional — app works without it)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Internationalization
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,es,fr,de

# Logging
LOG_LEVEL=info
```

> **Important:** Replace `your_postgres_password_here` with your actual PostgreSQL password.
> If you don't know your password, reset it — see Section 4.

---

## 4. Database Setup & Connection

### Step 1 — Open pgAdmin

Launch pgAdmin from your Start Menu or desktop shortcut.

### Step 2 — Connect to PostgreSQL server

1. In the left panel, right-click **Servers** → **Register** → **Server**
2. Fill in the **General** tab:
   - Name: `Event Locator`
3. Fill in the **Connection** tab:

| Field | Value |
|-------|-------|
| Host name/address | `localhost` |
| Port | `5432` |
| Maintenance database | `postgres` |
| Username | `postgres` |
| Password | *(your postgres password)* |

1. Check **Save password**
2. Click **Save**

### Step 3 — Create the database

In pgAdmin, right-click **Databases** → **Create** → **Database**

- Database name: `event_locator`
- Owner: `postgres`
- Click **Save**

Or run in pgAdmin Query Tool:

```sql
CREATE DATABASE event_locator;
```

### Step 4 — Enable PostGIS extension

In pgAdmin, navigate to:
`Servers → Event Locator → Databases → event_locator`

Open **Query Tool** (Tools → Query Tool) and run:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Verify PostGIS is active:

```sql
SELECT PostGIS_Version();
```

Expected output: `3.x USE_GEOS=1 USE_PROJ=1 USE_STATS=1`

### Step 5 — Run migrations

Back in your terminal (PowerShell or CMD):

```bash
npm run migrate
```

Expected output:

```
Starting database migrations...
Initializing database schema...
✓ Database connection successful
✓ Database schema initialized successfully
Seeding categories...
✓ Categories seeded successfully
Database migrations completed successfully!
```

### Step 6 — Verify tables in pgAdmin

In pgAdmin navigate to:
`event_locator → Schemas → public → Tables`

You should see these 11 tables:

```
categories
event_attendees
event_categories
event_reviews
events
favorite_events
notifications
spatial_ref_sys          ← created by PostGIS
user_category_preferences
user_preferences
users
```

### Step 7 — Reset PostgreSQL password (if needed)

If you don't know your postgres password, open pgAdmin and run:

```sql
ALTER USER postgres PASSWORD 'newpassword123';
```

Then update `DB_PASSWORD` in your `.env` file to match.

---

## 5. pgAdmin — Database Verification

Open the **Query Tool** in pgAdmin and run these queries to verify everything is set up correctly.

### Check all tables exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Check PostGIS spatial indexes

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE indexdef LIKE '%GIST%';
```

Expected: `idx_events_location` and `idx_users_location`

### Check all 10 categories are seeded

```sql
SELECT id, name, description
FROM categories
ORDER BY name;
```

Expected categories:

art, business, community, education, entertainment,
food, health, music, sports, technology

### Check events table has geospatial column

```sql
SELECT column_name, udt_name
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;
```

Look for `location` column with type `geography`

### Check triggers exist

```sql
SELECT tgname, relname
FROM pg_trigger
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
WHERE tgname LIKE 'update_%_updated_at';
```

Expected: triggers on `users`, `events`, `event_reviews`

---

## 6. Running the Server

### Development mode (auto-restart on file changes)

```bash
npm run dev
```

### Production mode

```bash
npm start
```

### Expected startup output

```
✓ Database connection successful
Initializing application...
✓ Database schema initialized successfully
Seeding categories...
✓ Categories seeded successfully
✓ Server running on port 3000
✓ Environment: development
```

If Redis is running you will also see:

✓ Redis notification service initialized

### Verify server is running

Open a browser or Postman and visit:

GET <http://localhost:3000/api/health>

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

## 7. Running Tests

### Unit tests only (no database required)

```bash
npm test
```

### Integration tests only

```bash
npm run test:integration
```

### All tests

```bash
npm run test:all
```

### Tests with coverage report

```bash
npm run test:coverage
```

### Expected test results

Test Suites: 7 passed, 7 total
Tests:       88 passed, 88 total

### View coverage report

After running `npm run test:coverage`, open in your browser:

coverage/lcov-report/index.html

---

## 8. API Testing Guide

### Setup in Postman

1. Open Postman
2. Create a new **Collection** named `Event Locator API`
3. Set base URL variable: `{{base_url}}` = `http://localhost:3000`
4. After login/register, set `{{token}}` variable with the JWT token
5. For authenticated requests, set **Authorization** → **Bearer Token** → `{{token}}`

---

### 🔐 AUTH APIs

#### Register a new user

```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

✅ Expected: `201 Created`

```json
{
  "success": true,
  "message": "User registration successful",
  "data": {
    "user": { "id": "...", "email": "john@example.com" },
    "token": "eyJhbGci..."
  }
}
```

> **Save the token** — you need it for all authenticated requests.

---

#### Login

```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

✅ Expected: `200 OK` with token

---

#### Get current user profile

```
GET http://localhost:3000/api/auth/me
Authorization: Bearer <token>
```

✅ Expected: `200 OK` with user data including location coordinates

---

#### Update profile

```
PUT http://localhost:3000/api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Johnny",
  "lastName": "Doe",
  "preferredLanguage": "en"
}
```

✅ Expected: `200 OK`

---

#### Update user location (sets PostGIS geography point)

```
PUT http://localhost:3000/api/auth/location
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

✅ Expected: `200 OK` with latitude/longitude returned

---

#### Change password

```
POST http://localhost:3000/api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

✅ Expected: `200 OK`

---

### 📅 EVENT APIs

#### Create an event

```
POST http://localhost:3000/api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "NYC Tech Conference 2025",
  "description": "Annual technology conference in New York City",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "address": "123 Broadway",
  "city": "New York",
  "country": "USA",
  "startDate": "2025-09-01T10:00:00Z",
  "endDate": "2025-09-01T18:00:00Z",
  "maxAttendees": 100,
  "categoryIds": ["<technology_category_id>"]
}
```

✅ Expected: `201 Created`
> **Save the event `id`** — you need it for subsequent requests.
> Get category IDs from: `GET http://localhost:3000/api/categories`

---

#### Get event by ID

```
GET http://localhost:3000/api/events/<event_id>
```

✅ Expected: `200 OK` with categories array, averageRating, reviewCount

---

#### Get your created events

```
GET http://localhost:3000/api/events
Authorization: Bearer <token>
```

✅ Expected: `200 OK` with events array

---

#### Update event (creator only)

```
PUT http://localhost:3000/api/events/<event_id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "NYC Tech Conference 2025 — Updated",
  "maxAttendees": 200
}
```

✅ Expected: `200 OK`
❌ If not creator: `403 Forbidden`

---

#### Search events by location (PostGIS radius search)

```
POST http://localhost:3000/api/events/search/location
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radiusKm": 50,
  "categoryIds": ["<technology_category_id>"]
}
```

✅ Expected: `200 OK` — results sorted by `distance_km` ascending

---

#### Text search events

```
GET http://localhost:3000/api/events/search?q=tech
```

✅ Expected: `200 OK` with matching events

---

#### Delete event (soft delete)

```
DELETE http://localhost:3000/api/events/<event_id>
Authorization: Bearer <token>
```

✅ Expected: `200 OK`
> Event is NOT removed from database — `is_active` is set to `false`

---

### 👤 USER PREFERENCE & FAVORITES APIs

#### Get all categories (use IDs in other requests)

```
GET http://localhost:3000/api/categories
```

✅ Expected: `200 OK` with 10 categories including their UUIDs

---

#### Set preferred categories

```
POST http://localhost:3000/api/users/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "categoryIds": ["<technology_category_id>", "<music_category_id>"]
}
```

✅ Expected: `200 OK`

---

#### Get preferences

```
GET http://localhost:3000/api/users/preferences
Authorization: Bearer <token>
```

✅ Expected: `200 OK` with `search_radius_km`, `notification_enabled`, `preferredCategories`

---

#### Update preferences

```
PUT http://localhost:3000/api/users/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "search_radius_km": 25,
  "notification_enabled": true,
  "newsletters_enabled": false
}
```

✅ Expected: `200 OK`

---

#### Add event to favorites

```
POST http://localhost:3000/api/users/favorites/<event_id>
Authorization: Bearer <token>
```

✅ Expected: `201 Created`
❌ If already favorited: `409 Conflict`

---

#### Check if event is favorited

```
GET http://localhost:3000/api/users/favorites/<event_id>/check
Authorization: Bearer <token>
```

✅ Expected: `200 OK`

```json
{ "success": true, "data": { "isFavorite": true } }
```

---

#### Get all favorite events

```
GET http://localhost:3000/api/users/favorites
Authorization: Bearer <token>
```

✅ Expected: `200 OK` with events list

---

#### Remove from favorites

```
DELETE http://localhost:3000/api/users/favorites/<event_id>
Authorization: Bearer <token>
```

✅ Expected: `200 OK`

---

#### Register for event

```
POST http://localhost:3000/api/users/events/<event_id>/register
Authorization: Bearer <token>
```

✅ Expected: `201 Created`
❌ If at capacity: `400 Bad Request`
❌ If already registered: `400 Bad Request`

---

#### Get events you are attending

```
GET http://localhost:3000/api/users/events/attending
Authorization: Bearer <token>
```

✅ Expected: `200 OK` with events and attendance status

---

#### Unregister from event

```
DELETE http://localhost:3000/api/users/events/<event_id>/unregister
Authorization: Bearer <token>
```

✅ Expected: `200 OK`

---

### ⭐ REVIEW APIs

> You must be **registered for the event** before leaving a review.
> Run the register for event request first.

#### Create or update a review

```
POST http://localhost:3000/api/reviews/<event_id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "reviewText": "Amazing event, highly recommended!"
}
```

✅ Expected: `201 Created`
> Submitting again updates the existing review

---

#### Get reviews for an event

```
GET http://localhost:3000/api/reviews/<event_id>?limit=10&offset=0
```

✅ Expected: `200 OK` with reviews array including reviewer names

---

#### Get review statistics

```
GET http://localhost:3000/api/reviews/<event_id>/stats
```

✅ Expected: `200 OK`

```json
{
  "totalReviews": 1,
  "averageRating": "5.00",
  "distribution": {
    "fiveStar": 1,
    "fourStar": 0,
    "threeStar": 0,
    "twoStar": 0,
    "oneStar": 0
  }
}
```

---

#### Get your review for an event

```
GET http://localhost:3000/api/reviews/<event_id>/user
Authorization: Bearer <token>
```

✅ Expected: `200 OK` with your review or `null`

---

#### Get top-rated events

```
GET http://localhost:3000/api/reviews/top-rated?limit=5
```

✅ Expected: `200 OK` with events sorted by average rating

---

#### Delete a review

```
DELETE http://localhost:3000/api/reviews/<review_id>
Authorization: Bearer <token>
```

✅ Expected: `200 OK`
❌ If not author: `403 Forbidden`

---

### 🔔 NOTIFICATION APIs

#### Get notifications

```
GET http://localhost:3000/api/notifications
Authorization: Bearer <token>
```

#### Get unread notifications only

```
GET http://localhost:3000/api/notifications?unreadOnly=true
Authorization: Bearer <token>
```

✅ Expected: `200 OK` with notifications array

---

#### Get unread count

```
GET http://localhost:3000/api/notifications/unread-count
Authorization: Bearer <token>
```

✅ Expected: `200 OK`

```json
{ "success": true, "data": { "count": 0 } }
```

---

#### Mark all notifications as read

```
PUT http://localhost:3000/api/notifications/mark-all-read
Authorization: Bearer <token>
```

✅ Expected: `200 OK`

---

#### Mark single notification as read

```
PUT http://localhost:3000/api/notifications/<notification_id>/read
Authorization: Bearer <token>
```

✅ Expected: `200 OK`

---

## 9. i18n Language Testing

The API automatically detects language from the `Accept-Language` header.

#### Test Spanish (es)

```
POST http://localhost:3000/api/auth/login
Accept-Language: es
Content-Type: application/json

{
  "email": "wrong@example.com",
  "password": "wrongpassword"
}
```

✅ Expected response message: `"Email o contraseña inválidos"`

---

#### Test French (fr)

```
POST http://localhost:3000/api/auth/register
Accept-Language: fr
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

✅ Expected response message: `"Enregistrement utilisateur réussi"`

---

#### Test German (de)

```
POST http://localhost:3000/api/auth/login
Accept-Language: de
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

✅ Expected response message: `"Anmeldung erfolgreich"`

---

## 10. pgAdmin — Verify Data After API Tests

After running the API tests, use these queries in pgAdmin Query Tool to confirm data was saved correctly.

### View all registered users with location

```sql
SELECT
  id,
  email,
  first_name,
  last_name,
  preferred_language,
  ST_X(location::geometry) AS longitude,
  ST_Y(location::geometry) AS latitude,
  created_at
FROM users
ORDER BY created_at DESC;
```

### View all events with coordinates

```sql
SELECT
  id,
  title,
  city,
  country,
  ST_X(location::geometry) AS longitude,
  ST_Y(location::geometry) AS latitude,
  start_date,
  end_date,
  max_attendees,
  current_attendees,
  is_active
FROM events
ORDER BY created_at DESC;
```

### Test PostGIS radius search directly in SQL

```sql
-- Find all events within 50km of New York City
SELECT
  title,
  city,
  ROUND(
    CAST(ST_DistanceSphere(
      location,
      ST_GeogFromText('POINT(-74.0060 40.7128)')
    ) / 1000 AS numeric), 2
  ) AS distance_km
FROM events
WHERE
  is_active = TRUE
  AND ST_DWithin(
    location,
    ST_GeogFromText('POINT(-74.0060 40.7128)'),
    50000
  )
ORDER BY distance_km ASC;
```

### View events with their categories

```sql
SELECT
  e.title,
  e.city,
  STRING_AGG(c.name, ', ') AS categories
FROM events e
JOIN event_categories ec ON e.id = ec.event_id
JOIN categories c ON ec.category_id = c.id
GROUP BY e.id, e.title, e.city
ORDER BY e.title;
```

### View all reviews with ratings

```sql
SELECT
  u.email,
  e.title AS event,
  er.rating,
  er.review_text,
  er.created_at
FROM event_reviews er
JOIN users u ON er.user_id = u.id
JOIN events e ON er.event_id = e.id
ORDER BY er.created_at DESC;
```

### View event rating statistics

```sql
SELECT
  e.title,
  COUNT(er.id) AS total_reviews,
  ROUND(AVG(er.rating)::numeric, 2) AS average_rating,
  COUNT(CASE WHEN er.rating = 5 THEN 1 END) AS five_star,
  COUNT(CASE WHEN er.rating = 4 THEN 1 END) AS four_star,
  COUNT(CASE WHEN er.rating = 3 THEN 1 END) AS three_star
FROM events e
LEFT JOIN event_reviews er ON e.id = er.event_id
GROUP BY e.id, e.title
HAVING COUNT(er.id) > 0
ORDER BY average_rating DESC;
```

### View user preferences and preferred categories

```sql
SELECT
  u.email,
  up.search_radius_km,
  up.notification_enabled,
  up.newsletters_enabled,
  STRING_AGG(c.name, ', ') AS preferred_categories
FROM users u
JOIN user_preferences up ON u.id = up.user_id
LEFT JOIN user_category_preferences ucp ON u.id = ucp.user_id
LEFT JOIN categories c ON ucp.category_id = c.id
GROUP BY u.email, up.search_radius_km, up.notification_enabled, up.newsletters_enabled;
```

### View favorite events per user

```sql
SELECT
  u.email,
  e.title AS favorite_event,
  fe.created_at AS favorited_at
FROM favorite_events fe
JOIN users u ON fe.user_id = u.id
JOIN events e ON fe.event_id = e.id
ORDER BY fe.created_at DESC;
```

### View event registrations

```sql
SELECT
  u.email,
  e.title AS event,
  ea.status,
  ea.joined_at
FROM event_attendees ea
JOIN users u ON ea.user_id = u.id
JOIN events e ON ea.event_id = e.id
ORDER BY ea.joined_at DESC;
```

### View notifications

```sql
SELECT
  u.email,
  n.type,
  n.title,
  n.message,
  n.read,
  n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
ORDER BY n.created_at DESC;
```

### Verify soft-deleted events are hidden from search

```sql
-- Active events (visible in API)
SELECT title, is_active FROM events WHERE is_active = TRUE;

-- All events including deleted
SELECT title, is_active FROM events;
```

### Check all indexes are in place

```sql
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## Quick Reference — All API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Get profile |
| PUT | `/api/auth/profile` | Yes | Update profile |
| PUT | `/api/auth/location` | Yes | Update location |
| POST | `/api/auth/change-password` | Yes | Change password |
| POST | `/api/events` | Yes | Create event |
| GET | `/api/events` | Yes | Get my events |
| GET | `/api/events/:id` | No | Get event by ID |
| PUT | `/api/events/:id` | Yes | Update event |
| DELETE | `/api/events/:id` | Yes | Delete event |
| POST | `/api/events/search/location` | No | Radius search |
| GET | `/api/events/search?q=` | No | Text search |
| GET | `/api/users/preferences` | Yes | Get preferences |
| PUT | `/api/users/preferences` | Yes | Update preferences |
| POST | `/api/users/categories` | Yes | Set categories |
| POST | `/api/users/favorites/:id` | Yes | Add favorite |
| DELETE | `/api/users/favorites/:id` | Yes | Remove favorite |
| GET | `/api/users/favorites` | Yes | List favorites |
| GET | `/api/users/favorites/:id/check` | Yes | Check favorite |
| POST | `/api/users/events/:id/register` | Yes | Register for event |
| DELETE | `/api/users/events/:id/unregister` | Yes | Unregister |
| GET | `/api/users/events/attending` | Yes | Attending events |
| POST | `/api/reviews/:eventId` | Yes | Create/update review |
| GET | `/api/reviews/:eventId` | No | Get reviews |
| GET | `/api/reviews/:eventId/stats` | No | Review stats |
| GET | `/api/reviews/:eventId/user` | Yes | My review |
| DELETE | `/api/reviews/:reviewId` | Yes | Delete review |
| GET | `/api/reviews/top-rated` | No | Top rated events |
| GET | `/api/notifications` | Yes | Get notifications |
| GET | `/api/notifications/unread-count` | Yes | Unread count |
| PUT | `/api/notifications/mark-all-read` | Yes | Mark all read |
| PUT | `/api/notifications/:id/read` | Yes | Mark one read |
| GET | `/api/categories` | No | List categories |
| GET | `/api/categories/:id` | No | Get category |
| GET | `/api/health` | No | Health check |
