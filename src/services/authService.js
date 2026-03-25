/**
 * Authentication Service
 * Handles user registration, login, and token generation
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

class AuthService {
  /**
   * Register a new user
   */
  async registerUser(userData) {
    const { email, password, firstName, lastName } = userData;

    // Check if user already exists
    const existingUser = await db.oneOrNone(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const user = await db.one(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, preferred_language)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, preferred_language, created_at`,
      [userId, email, hashedPassword, firstName, lastName, 'en']
    );

    // Create user preferences
    await db.none(
      'INSERT INTO user_preferences (id, user_id) VALUES ($1, $2)',
      [uuidv4(), userId]
    );

    const token = this.generateToken(user.id);

    logger.info(`User registered: ${email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        preferredLanguage: user.preferred_language,
      },
      token,
    };
  }

  /**
   * Login user
   */
  async loginUser(email, password) {
    const user = await db.oneOrNone(
      `SELECT id, email, password_hash, first_name, last_name, preferred_language, is_active
       FROM users WHERE email = $1`,
      [email]
    );

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.is_active) {
      throw new Error('User account is inactive');
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user.id);

    logger.info(`User logged in: ${email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        preferredLanguage: user.preferred_language,
      },
      token,
    };
  }

  /**
   * Generate JWT token
   */
  generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const user = await db.oneOrNone(
      `SELECT id, email, first_name, last_name, phone,
              ST_X(location::geometry) AS longitude,
              ST_Y(location::geometry) AS latitude,
              preferred_language, created_at, is_active FROM users WHERE id = $1`,
      [userId]
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updates) {
    const allowedFields = [
      'first_name',
      'last_name',
      'phone',
      'preferred_language',
    ];
    const updateSet = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateSet.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updateSet.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateSet.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const user = await db.one(
      `UPDATE users SET ${updateSet.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, first_name, last_name, phone, preferred_language`,
      values
    );

    logger.info(`User profile updated: ${userId}`);

    return user;
  }

  /**
   * Update user location
   */
  async updateUserLocation(userId, latitude, longitude) {
    const user = await db.one(
      `UPDATE users 
       SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude`,
      [longitude, latitude, userId]
    );

    logger.info(`User location updated: ${userId}`);

    return user;
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await db.oneOrNone(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      throw new Error('User not found');
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      throw new Error('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await db.none(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    logger.info(`Password changed for user: ${userId}`);

    return true;
  }
}

module.exports = new AuthService();
