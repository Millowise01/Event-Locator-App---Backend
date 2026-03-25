const request = require('supertest');
const app = require('../../index');

// These integration tests would run against a test database
// In production, mock the database or use a test database

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return user when authenticated', async () => {
      // First login to get token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123'
        });

      const token = loginRes.body.data.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });
});

describe('Event Endpoints', () => {
  describe('POST /api/events', () => {
    it('should create event with valid data', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${getValidToken()}`)
        .send({
          title: 'Tech Conference',
          description: 'Annual tech conference',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          city: 'New York',
          country: 'USA',
          startDate: '2024-06-01T10:00:00Z',
          endDate: '2024-06-01T18:00:00Z',
          maxAttendees: 100
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
    });

    it('should return 400 for invalid coordinates', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${getValidToken()}`)
        .send({
          title: 'Event',
          latitude: 100, // Invalid latitude
          longitude: -74.0060,
          startDate: '2024-06-01T10:00:00Z',
          endDate: '2024-06-01T18:00:00Z'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return event details', async () => {
      const res = await request(app)
        .get('/api/events/valid-event-id');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });
});

describe('Health Check', () => {
  it('should return health status', async () => {
    const res = await request(app)
      .get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('i18n Support', () => {
  it('should return messages in requested language', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Accept-Language', 'es')
      .send({
        email: 'invalid@example.com',
        password: 'password'
      });

    expect(res.status).toBe(401);
    // Message should be in Spanish
    expect(res.body.message).toBeDefined();
  });
});

// Helper function to get valid token
function getValidToken() {
  // This should be implemented to generate a valid JWT token for testing
  const jwt = require('jsonwebtoken');
  return jwt.sign({ userId: 'test-user-id' }, process.env.JWT_SECRET, { expiresIn: '1h' });
}
