#!/usr/bin/env node
/**
 * Database Migration Runner
 * Executes database schema initialization and seeding
 */

require('dotenv').config();
const { db } = require('../connection');
const { initializeDatabase } = require('../schema');
const { seedCategories } = require('../seeds');

async function runMigrations() {
  try {
    console.log('Starting database migrations...\n');

    // Initialize schema
    const schemaSuccess = await initializeDatabase();
    if (!schemaSuccess) {
      throw new Error('Schema initialization failed');
    }

    // Seed data
    const seedSuccess = await seedCategories();
    if (!seedSuccess) {
      throw new Error('Database seeding failed');
    }

    console.log('\nDatabase migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\nMigration failed:', error.message);
    process.exit(1);
  }
}

// Run migrations
runMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
