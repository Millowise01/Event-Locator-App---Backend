require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { i18next, i18nMiddleware } = require('./config/i18n');
const logger = require('./config/logger');
const { initializeDatabase } = require('./database/schema');
const { seedCategories } = require('./database/seeds');

// Import routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// i18n middleware
app.use(i18nMiddleware.handle(i18next));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/categories', categoryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: req.i18n.t('not_found')
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || req.i18n.t('error'),
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Initialize application
async function startServer() {
  try {
    console.log('Initializing application...');

    // Initialize database
    await initializeDatabase();

    // Seed categories
    await seedCategories();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start server if not in test mode
if (require.main === module) {
  startServer();
}

module.exports = app;
