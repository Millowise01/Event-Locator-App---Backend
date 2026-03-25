const { calculateDistance, isValidLatitude, isValidLongitude, isValidCoordinates, getSearchBounds } = require('../../utils/geoUtils');
const { AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError } = require('../../utils/errors');
const { SUPPORTED_LANGUAGES, NOTIFICATION_TYPES, HTTP_STATUS_CODES, JWT_CONFIG } = require('../../utils/constants');
const ResponseFormatter = require('../../utils/responseFormatter');

describe('geoUtils', () => {
  describe('calculateDistance', () => {
    it('should return 0 for same coordinates', () => {
      expect(calculateDistance(40.7128, -74.006, 40.7128, -74.006)).toBe(0);
    });

    it('should calculate distance between NYC and LA (~3940 km)', () => {
      const dist = calculateDistance(40.7128, -74.006, 34.0522, -118.2437);
      expect(dist).toBeGreaterThan(3900);
      expect(dist).toBeLessThan(4000);
    });
  });

  describe('isValidLatitude', () => {
    it('should return true for valid latitude', () => {
      expect(isValidLatitude(40.7128)).toBe(true);
      expect(isValidLatitude(-90)).toBe(true);
      expect(isValidLatitude(90)).toBe(true);
    });

    it('should return false for invalid latitude', () => {
      expect(isValidLatitude(91)).toBe(false);
      expect(isValidLatitude(-91)).toBe(false);
      expect(isValidLatitude(null)).toBeFalsy();
    });
  });

  describe('isValidLongitude', () => {
    it('should return true for valid longitude', () => {
      expect(isValidLongitude(-74.006)).toBe(true);
      expect(isValidLongitude(-180)).toBe(true);
      expect(isValidLongitude(180)).toBe(true);
    });

    it('should return false for invalid longitude', () => {
      expect(isValidLongitude(181)).toBe(false);
      expect(isValidLongitude(null)).toBeFalsy();
    });
  });

  describe('isValidCoordinates', () => {
    it('should return true for valid coordinates', () => {
      expect(isValidCoordinates(40.7128, -74.006)).toBe(true);
    });

    it('should return false for invalid coordinates', () => {
      expect(isValidCoordinates(200, -74.006)).toBe(false);
      expect(isValidCoordinates(40.7128, 200)).toBe(false);
    });
  });

  describe('getSearchBounds', () => {
    it('should return bounding box for radius', () => {
      const bounds = getSearchBounds(40.7128, -74.006, 10);
      expect(bounds.minLat).toBeLessThan(40.7128);
      expect(bounds.maxLat).toBeGreaterThan(40.7128);
      expect(bounds.minLon).toBeLessThan(-74.006);
      expect(bounds.maxLon).toBeGreaterThan(-74.006);
    });
  });
});

describe('Custom Error Classes', () => {
  it('AppError sets statusCode and message', () => {
    const err = new AppError('test error', 422);
    expect(err.message).toBe('test error');
    expect(err.statusCode).toBe(422);
    expect(err.timestamp).toBeDefined();
  });

  it('ValidationError defaults to 400', () => {
    const err = new ValidationError('bad input');
    expect(err.statusCode).toBe(400);
  });

  it('NotFoundError defaults to 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
  });

  it('UnauthorizedError defaults to 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
  });

  it('ForbiddenError defaults to 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
  });

  it('ConflictError defaults to 409', () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
  });
});

describe('Constants', () => {
  it('should export supported languages', () => {
    expect(SUPPORTED_LANGUAGES).toContain('en');
    expect(SUPPORTED_LANGUAGES).toContain('es');
    expect(SUPPORTED_LANGUAGES).toContain('fr');
    expect(SUPPORTED_LANGUAGES).toContain('de');
  });

  it('should export notification types', () => {
    expect(NOTIFICATION_TYPES.EVENT_REMINDER).toBeDefined();
    expect(NOTIFICATION_TYPES.NEW_EVENT).toBeDefined();
  });

  it('should export HTTP status codes', () => {
    expect(HTTP_STATUS_CODES.OK).toBe(200);
    expect(HTTP_STATUS_CODES.NOT_FOUND).toBe(404);
    expect(HTTP_STATUS_CODES.UNAUTHORIZED).toBe(401);
  });

  it('should export JWT config', () => {
    expect(JWT_CONFIG.expiresIn).toBe('7d');
  });
});

describe('ResponseFormatter', () => {
  it('success formats correctly', () => {
    const res = ResponseFormatter.success({ id: 1 }, 'Done', 200);
    expect(res.success).toBe(true);
    expect(res.message).toBe('Done');
    expect(res.data).toEqual({ id: 1 });
    expect(res.timestamp).toBeDefined();
  });

  it('error formats correctly', () => {
    const res = ResponseFormatter.error('Failed', 500);
    expect(res.success).toBe(false);
    expect(res.message).toBe('Failed');
    expect(res.statusCode).toBe(500);
  });

  it('paginated formats correctly', () => {
    const res = ResponseFormatter.paginated([1, 2], 1, 10, 100);
    expect(res.success).toBe(true);
    expect(res.pagination.pages).toBe(10);
    expect(res.pagination.total).toBe(100);
  });
});
