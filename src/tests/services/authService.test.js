const authService = require('../../services/authService');
const { db } = require('../../database/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock the database
jest.mock('../../database/connection');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const mockUser = {
        id: '12345',
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        preferred_language: 'en'
      };

      db.oneOrNone.mockResolvedValueOnce(null); // No existing user
      db.one.mockResolvedValueOnce(mockUser);
      db.none.mockResolvedValueOnce(); // User preferences created

      const result = await authService.registerUser(userData);

      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.token).toBeDefined();
      expect(db.oneOrNone).toHaveBeenCalledWith(
        'SELECT id FROM users WHERE email = $1',
        [userData.email]
      );
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      db.oneOrNone.mockResolvedValueOnce({ id: '12345' }); // User exists

      await expect(authService.registerUser(userData))
        .rejects
        .toThrow('User with this email already exists');
    });
  });

  describe('loginUser', () => {
    it('should login user successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const mockUser = {
        id: '12345',
        email,
        password_hash: hashedPassword,
        first_name: 'John',
        last_name: 'Doe',
        preferred_language: 'en',
        is_active: true
      };

      db.oneOrNone.mockResolvedValueOnce(mockUser);

      const result = await authService.loginUser(email, password);

      expect(result.user).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email
      }));
      expect(result.user.password_hash).toBeUndefined();
      expect(result.token).toBeDefined();
    });

    it('should throw error for invalid credentials', async () => {
      db.oneOrNone.mockResolvedValueOnce(null);

      await expect(authService.loginUser('test@example.com', 'password'))
        .rejects
        .toThrow('Invalid email or password');
    });

    it('should throw error for inactive user', async () => {
      const mockUser = {
        id: '12345',
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        is_active: false
      };

      db.oneOrNone.mockResolvedValueOnce(mockUser);

      await expect(authService.loginUser('test@example.com', 'password123'))
        .rejects
        .toThrow('User account is inactive');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = authService.generateToken('12345');
      const decoded = authService.verifyToken(token);

      expect(decoded.userId).toBe('12345');
    });

    it('should throw error for invalid token', () => {
      expect(() => authService.verifyToken('invalid.token.here'))
        .toThrow('Invalid or expired token');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = '12345';
      const currentPassword = 'oldpassword';
      const newPassword = 'newpassword';
      const hashedOldPassword = await bcrypt.hash(currentPassword, 10);

      db.oneOrNone.mockResolvedValueOnce({ password_hash: hashedOldPassword });
      db.none.mockResolvedValueOnce();

      const result = await authService.changePassword(userId, currentPassword, newPassword);

      expect(result).toBe(true);
    });

    it('should throw error for wrong current password', async () => {
      const userId = '12345';
      const hashedPassword = await bcrypt.hash('correctpassword', 10);

      db.oneOrNone.mockResolvedValueOnce({ password_hash: hashedPassword });

      await expect(authService.changePassword(userId, 'wrongpassword', 'newpassword'))
        .rejects
        .toThrow('Current password is incorrect');
    });
  });
});
