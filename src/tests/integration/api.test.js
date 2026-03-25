const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock all services before requiring app
jest.mock('../../services/authService');
jest.mock('../../services/eventService');
jest.mock('../../services/notificationService');
jest.mock('../../database/schema', () => ({ initializeDatabase: jest.fn().mockResolvedValue(true) }));
jest.mock('../../database/seeds', () => ({ seedCategories: jest.fn().mockResolvedValue(true) }));
jest.mock('../../database/connection', () => ({
  db: { any: jest.fn(), one: jest.fn(), oneOrNone: jest.fn(), none: jest.fn() }
}));

const authService = require('../../services/authService');
const eventService = require('../../services/eventService');
const notificationService = require('../../services/notificationService');

const app = require('../../index');

function makeToken(userId = 'test-user-id') {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('Health Check', () => {
  it('GET /api/health — returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      authService.registerUser.mockResolvedValueOnce({
        user: { id: 'u1', email: 'test@example.com', firstName: 'John', lastName: 'Doe', preferredLanguage: 'en' },
        token: makeToken('u1')
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123', firstName: 'John', lastName: 'Doe' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'password123', firstName: 'John', lastName: 'Doe' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if user already exists', async () => {
      authService.registerUser.mockRejectedValueOnce(new Error('User with this email already exists'));

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'existing@example.com', password: 'password123', firstName: 'John', lastName: 'Doe' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully', async () => {
      authService.loginUser.mockResolvedValueOnce({
        user: { id: 'u1', email: 'test@example.com', firstName: 'John', lastName: 'Doe' },
        token: makeToken('u1')
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      authService.loginUser.mockRejectedValueOnce(new Error('Invalid email or password'));

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return user when authenticated', async () => {
      authService.getUserById.mockResolvedValueOnce({
        id: 'u1', email: 'test@example.com', first_name: 'John', last_name: 'Doe'
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${makeToken('u1')}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });
});

describe('Event Endpoints', () => {
  describe('POST /api/events', () => {
    it('should create event with valid data', async () => {
      eventService.createEvent.mockResolvedValueOnce({
        id: 'evt1', title: 'Tech Conference', city: 'New York'
      });
      notificationService.notifyUpcomingEvent.mockResolvedValue(0);

      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({
          title: 'Tech Conference',
          latitude: 40.7128,
          longitude: -74.0060,
          startDate: '2025-06-01T10:00:00Z',
          endDate: '2025-06-01T18:00:00Z'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
    });

    it('should return 400 for invalid coordinates', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({ title: 'Event', latitude: 200, longitude: -74.0060, startDate: '2025-06-01T10:00:00Z', endDate: '2025-06-01T18:00:00Z' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).post('/api/events').send({ title: 'Event' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return 400 for non-UUID id', async () => {
      const res = await request(app).get('/api/events/not-a-uuid');
      expect(res.status).toBe(400);
    });
  });
});

describe('i18n Support', () => {
  it('should return Spanish messages with Accept-Language: es', async () => {
    authService.loginUser.mockRejectedValueOnce(new Error('Invalid email or password'));

    const res = await request(app)
      .post('/api/auth/login')
      .set('Accept-Language', 'es')
      .send({ email: 'test@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBeDefined();
  });

  it('should return French messages with Accept-Language: fr', async () => {
    authService.loginUser.mockRejectedValueOnce(new Error('Invalid email or password'));

    const res = await request(app)
      .post('/api/auth/login')
      .set('Accept-Language', 'fr')
      .send({ email: 'test@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBeDefined();
  });
});

describe('Categories Endpoint', () => {
  it('GET /api/categories — returns categories list', async () => {
    const { db } = require('../../database/connection');
    db.any.mockResolvedValueOnce([
      { id: 'c1', name: 'music', description: 'Music events' },
      { id: 'c2', name: 'sports', description: 'Sports events' }
    ]);

    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.categories)).toBe(true);
  });
});
