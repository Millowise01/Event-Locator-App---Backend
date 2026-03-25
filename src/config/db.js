/**
 * Database configuration wrapper
 * Exports the database connection from the connection module
 */

const { db } = require('../database/connection');

module.exports = db;