/**
 * Constants File
 * Application-wide constants
 */

const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de'];

const DEFAULT_PAGINATION = {
  limit: 20,
  offset: 0,
  maxLimit: 100,
};

const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const ATTENDANCE_STATUS = {
  ATTENDING: 'attending',
  INTERESTED: 'interested',
  NOT_ATTENDING: 'not_attending',
  CANCELLED: 'cancelled',
};

const NOTIFICATION_TYPES = {
  EVENT_REMINDER: 'event_reminder',
  NEW_EVENT: 'new_event',
  EVENT_UPDATED: 'event_updated',
  REVIEW_RECEIVED: 'review_received',
  USER_JOINED: 'user_joined',
};

const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

const JWT_CONFIG = {
  expiresIn: '7d',
  algorithm: 'HS256',
};

const PASSWORD_HASH_ROUNDS = 10;

const DEFAULT_SEARCH_RADIUS_KM = 10;
const MAX_SEARCH_RADIUS_KM = 50;

const EVENT_CAPACITY_DEFAULTS = {
  min: 1,
  max: 10000,
  default: 100,
};

module.exports = {
  SUPPORTED_LANGUAGES,
  DEFAULT_PAGINATION,
  EVENT_STATUS,
  ATTENDANCE_STATUS,
  NOTIFICATION_TYPES,
  HTTP_STATUS_CODES,
  JWT_CONFIG,
  PASSWORD_HASH_ROUNDS,
  DEFAULT_SEARCH_RADIUS_KM,
  MAX_SEARCH_RADIUS_KM,
  EVENT_CAPACITY_DEFAULTS,
};
