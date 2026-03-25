const redis = require('redis');
const { db } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

/**
 * Notification Service
 * Handles notifications with Redis Pub/Sub for async task handling
 */

class NotificationService {
  constructor() {
    this.client = null;
    this.subscriber = null;
    this.initialized = false;
  }

  /**
   * Initialize Redis connection
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this.client = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379
        },
        password: process.env.REDIS_PASSWORD || undefined
      });

      this.subscriber = this.client.duplicate();

      this.client.on('error', (err) => console.error('Redis Client Error:', err));
      this.subscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));

      await this.client.connect();
      await this.subscriber.connect();

      this.initialized = true;
      console.log('✓ Redis notification service initialized');
    } catch (error) {
      console.error('✗ Redis initialization failed:', error.message);
      console.warn('Running without notification queue support');
    }
  }

  /**
   * Create and store notification
   * @param {string} userId - User ID
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Created notification
   */
  async createNotification(userId, notificationData) {
    const { eventId, type, title, message } = notificationData;

    const notification = await db.one(
      `INSERT INTO notifications (id, user_id, event_id, type, title, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, event_id, type, title, message, read, created_at`,
      [uuidv4(), userId, eventId, type, title, message]
    );

    // Publish to Redis for real-time updates
    if (this.initialized && this.client) {
      try {
        await this.client.publish(
          `user:${userId}:notifications`,
          JSON.stringify(notification)
        );
      } catch (error) {
        console.error('Error publishing notification to Redis:', error.message);
      }
    }

    return notification;
  }

  /**
   * Get user notifications
   * @param {string} userId - User ID
   * @param {boolean} unreadOnly - Only unread notifications
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} Notifications
   */
  async getUserNotifications(userId, unreadOnly = false, limit = 50) {
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [userId];

    if (unreadOnly) {
      query += ' AND read = FALSE';
    }

    query += ' ORDER BY created_at DESC LIMIT $2';
    params.push(limit);

    return db.any(query, params);
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<boolean>} Success
   */
  async markAsRead(notificationId) {
    await db.none(
      'UPDATE notifications SET read = TRUE WHERE id = $1',
      [notificationId]
    );
    return true;
  }

  /**
   * Mark all notifications as read for user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success
   */
  async markAllAsRead(userId) {
    await db.none(
      'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE',
      [userId]
    );
    return true;
  }

  /**
   * Send event notification to matching users
   * Publishes to Redis for async processing
   * @param {string} eventId - Event ID
   * @param {Object} notificationData - Notification data
   * @returns {Promise<void>}
   */
  async publishEventNotification(eventId, notificationData) {
    if (!this.initialized || !this.client) {
      console.warn('Redis not available for notification publishing');
      return;
    }

    try {
      await this.client.publish(
        'event:notifications',
        JSON.stringify({
          eventId,
          ...notificationData,
          timestamp: new Date().toISOString()
        })
      );
    } catch (error) {
      console.error('Error publishing event notification:', error.message);
    }
  }

  /**
   * Send scheduled notification after a delay
   * @param {string} userId - User ID
   * @param {Object} notificationData - Notification data
   * @param {number} delaySeconds - Delay in seconds
   * @returns {Promise<void>}
   */
  async sendScheduledNotification(userId, notificationData, delaySeconds) {
    if (!this.initialized || !this.client) {
      console.warn('Redis not available for scheduled notifications');
      return;
    }

    try {
      // Use Redis ZADD for delayed queue
      const timestamp = Date.now() + delaySeconds * 1000;
      await this.client.zAdd(
        'scheduled:notifications',
        {
          score: timestamp,
          member: JSON.stringify({
            userId,
            notificationData,
            scheduledFor: new Date(timestamp).toISOString()
          })
        }
      );
    } catch (error) {
      console.error('Error scheduling notification:', error.message);
    }
  }

  /**
   * Subscribe to user notifications (for real-time updates)
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function for notifications
   * @returns {Promise<void>}
   */
  async subscribeToNotifications(userId, callback) {
    if (!this.initialized || !this.subscriber) {
      console.warn('Redis not available for subscriptions');
      return;
    }

    try {
      await this.subscriber.subscribe(
        `user:${userId}:notifications`,
        (message) => {
          try {
            const notification = JSON.parse(message);
            callback(notification);
          } catch (error) {
            console.error('Error parsing notification:', error.message);
          }
        }
      );
    } catch (error) {
      console.error('Error subscribing to notifications:', error.message);
    }
  }

  /**
   * Notify users about upcoming events
   * @param {string} eventId - Event ID
   * @returns {Promise<number>} Number of notifications sent
   */
  async notifyUpcomingEvent(eventId) {
    // Get event details
    const event = await db.one(
      `SELECT id, title, start_date FROM events WHERE id = $1`,
      [eventId]
    );

    // Get users interested in this event's categories
    const users = await db.any(
      `SELECT DISTINCT u.id, u.email 
       FROM users u
       JOIN user_category_preferences ucp ON u.id = ucp.user_id
       JOIN event_categories ec ON ucp.category_id = ec.category_id
       WHERE ec.event_id = $1
       AND u.id NOT IN (
         SELECT user_id FROM event_attendees WHERE event_id = $1
       )`,
      [eventId]
    );

    let notificationCount = 0;

    for (const user of users) {
      try {
        await this.createNotification(user.id, {
          eventId,
          type: 'upcoming_event',
          title: `New Event: ${event.title}`,
          message: `A new event matching your interests is coming on ${event.start_date}`
        });
        notificationCount++;
      } catch (error) {
        console.error(`Error notifying user ${user.id}:`, error.message);
      }
    }

    return notificationCount;
  }

  /**
   * Get unread notification count
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread count
   */
  async getUnreadCount(userId) {
    const result = await db.one(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND read = FALSE',
      [userId]
    );

    return parseInt(result.count);
  }

  /**
   * Clean up old notifications (older than 30 days)
   * @returns {Promise<number>} Number of deleted notifications
   */
  async cleanupOldNotifications() {
    const result = await db.result(
      `DELETE FROM notifications 
       WHERE created_at < NOW() - INTERVAL '30 days'
       AND read = TRUE`,
      []
    );

    return result.rowCount;
  }
}

module.exports = new NotificationService();
