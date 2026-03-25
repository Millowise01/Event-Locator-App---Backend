const express = require('express');
const { param } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validationMiddleware');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

// GET /api/categories
router.get('/', categoryController.getAllCategories);

// GET /api/categories/:id
router.get('/:id',
  [param('id').isUUID()],
  handleValidationErrors,
  categoryController.getCategoryById
);

module.exports = router;
