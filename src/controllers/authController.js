const authService = require('../services/authService');
const logger = require('../config/logger');

async function register(req, res) {
  try {
    const { email, password, firstName, lastName } = req.body;
    const result = await authService.registerUser({ email, password, firstName, lastName });
    logger.info(`User registered: ${result.user.email}`);
    res.status(201).json({
      success: true,
      message: req.t('auth.register_success'),
      data: { user: result.user, token: result.token }
    });
  } catch (error) {
    logger.error('Registration error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    logger.info(`User logged in: ${result.user.email}`);
    res.json({
      success: true,
      message: req.t('auth.login_success'),
      data: { user: result.user, token: result.token }
    });
  } catch (error) {
    logger.error('Login error:', error.message);
    res.status(401).json({ success: false, message: error.message });
  }
}

async function getMe(req, res) {
  try {
    const user = await authService.getUserById(req.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Get user error:', error.message);
    res.status(404).json({ success: false, message: error.message });
  }
}

async function updateProfile(req, res) {
  try {
    const user = await authService.updateUserProfile(req.userId, req.body);
    logger.info(`User profile updated: ${req.userId}`);
    res.json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    logger.error('Update profile error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function updateLocation(req, res) {
  try {
    const { latitude, longitude } = req.body;
    const user = await authService.updateUserLocation(req.userId, latitude, longitude);
    logger.info(`User location updated: ${req.userId}`);
    res.json({ success: true, message: 'Location updated successfully', data: user });
  } catch (error) {
    logger.error('Update location error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.userId, currentPassword, newPassword);
    logger.info(`Password changed: ${req.userId}`);
    res.json({ success: true, message: req.t('auth.password_changed') });
  } catch (error) {
    logger.error('Change password error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = { register, login, getMe, updateProfile, updateLocation, changePassword };
