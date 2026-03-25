const { db } = require('../database/connection');
const logger = require('../config/logger');

async function getAllCategories(req, res) {
  try {
    const categories = await db.any('SELECT id, name, description FROM categories ORDER BY name ASC');
    res.json({ success: true, data: { count: categories.length, categories } });
  } catch (error) {
    logger.error('Get categories error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getCategoryById(req, res) {
  try {
    const category = await db.oneOrNone(
      'SELECT id, name, description FROM categories WHERE id = $1',
      [req.params.id]
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    logger.error('Get category error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = { getAllCategories, getCategoryById };
