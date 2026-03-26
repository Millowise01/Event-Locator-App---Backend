const { globalErrorHandler, notFoundHandler } = require('../../middleware/errorHandler');
const { globalErrorHandler: globalErrorHandler2, notFoundHandler: notFoundHandler2 } = require('../../middleware/errorMiddleware');
const { authenticateToken } = require('../../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

// ── helpers ──────────────────────────────────────────────────────────────────

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides = {}) {
  return {
    path: '/test',
    method: 'GET',
    headers: {},
    i18n: { t: (key) => key },
    ...overrides,
  };
}

// ── errorHandler.js ───────────────────────────────────────────────────────────

describe('errorHandler — globalErrorHandler', () => {
  const next = jest.fn();

  it('uses err.statusCode when present', () => {
    const err = { message: 'Not found', statusCode: 404, stack: 'stack' };
    const res = mockRes();
    globalErrorHandler(err, mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Not found' }));
  });

  it('defaults to 500 when no statusCode', () => {
    const err = { message: 'Boom', stack: 'stack' };
    const res = mockRes();
    globalErrorHandler(err, mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('includes stack in development mode', () => {
    process.env.NODE_ENV = 'development';
    const err = { message: 'Dev error', statusCode: 500, stack: 'trace' };
    const res = mockRes();
    globalErrorHandler(err, mockReq(), res, next);
    const body = res.json.mock.calls[0][0];
    expect(body.stack).toBe('trace');
    process.env.NODE_ENV = 'test';
  });

  it('omits stack in non-development mode', () => {
    process.env.NODE_ENV = 'test';
    const err = { message: 'Prod error', statusCode: 500, stack: 'trace' };
    const res = mockRes();
    globalErrorHandler(err, mockReq(), res, next);
    const body = res.json.mock.calls[0][0];
    expect(body.stack).toBeUndefined();
  });
});

describe('errorHandler — notFoundHandler', () => {
  it('returns 404 with i18n message', () => {
    const req = mockReq({ i18n: { t: () => 'Resource not found' } });
    const res = mockRes();
    notFoundHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Resource not found' });
  });

  it('falls back when i18n is absent', () => {
    const req = mockReq({ i18n: undefined });
    const res = mockRes();
    notFoundHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Resource not found' });
  });
});

// ── errorMiddleware.js ────────────────────────────────────────────────────────

describe('errorMiddleware — globalErrorHandler', () => {
  const next = jest.fn();

  it('uses err.statusCode when present', () => {
    const err = { message: 'Forbidden', statusCode: 403, stack: 'stack' };
    const res = mockRes();
    globalErrorHandler2(err, mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Forbidden' }));
  });

  it('defaults to 500 when no statusCode', () => {
    const err = { message: 'Unknown', stack: 'stack' };
    const res = mockRes();
    globalErrorHandler2(err, mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('includes stack in development mode', () => {
    process.env.NODE_ENV = 'development';
    const err = { message: 'Dev', statusCode: 500, stack: 'trace' };
    const res = mockRes();
    globalErrorHandler2(err, mockReq(), res, next);
    const body = res.json.mock.calls[0][0];
    expect(body.stack).toBe('trace');
    process.env.NODE_ENV = 'test';
  });
});

describe('errorMiddleware — notFoundHandler', () => {
  it('returns 404 with i18n message', () => {
    const req = mockReq({ i18n: { t: () => 'Not found' } });
    const res = mockRes();
    notFoundHandler2(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('falls back when i18n is absent', () => {
    const req = mockReq({ i18n: undefined });
    const res = mockRes();
    notFoundHandler2(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ── authMiddleware.js ─────────────────────────────────────────────────────────

describe('authMiddleware — authenticateToken', () => {
  const next = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('calls next() with valid token', () => {
    const token = jwt.sign({ userId: 'u1' }, process.env.JWT_SECRET);
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = mockRes();
    authenticateToken(req, res, next);
    // jwt.verify is async callback — wait a tick
    return new Promise((resolve) => setImmediate(() => {
      expect(next).toHaveBeenCalled();
      expect(req.userId).toBe('u1');
      resolve();
    }));
  });

  it('returns 401 when no token provided', () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for invalid token', () => {
    const req = mockReq({ headers: { authorization: 'Bearer invalid.token.here' } });
    const res = mockRes();
    authenticateToken(req, res, next);
    return new Promise((resolve) => setImmediate(() => {
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
      resolve();
    }));
  });

  it('returns 401 for malformed authorization header', () => {
    const req = mockReq({ headers: { authorization: 'NotBearer token' } });
    const res = mockRes();
    authenticateToken(req, res, next);
    return new Promise((resolve) => setImmediate(() => {
      expect(res.status).toHaveBeenCalledWith(401);
      resolve();
    }));
  });
});
