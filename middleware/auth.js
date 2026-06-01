const Config = require('../models/Config');

/**
 * Admin authentication middleware.
 * Checks the x-admin-pin header against database Config adminPin or env.
 */
const auth = async (req, res, next) => {
  try {
    const pin = req.headers['x-admin-pin'];

    if (!pin) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const config = await Config.findOne();
    const dbPin = config?.adminPin || process.env.ADMIN_PIN || 'skyweb2024';

    if (pin !== dbPin) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = auth;

