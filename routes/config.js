const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Config = require('../models/Config');

// GET /api/config — public (widget needs this)
// Never expose ownerEmail or ownerPhone
router.get('/', async (req, res) => {
  try {
    const config = await Config.findOne();

    if (!config) {
      return res.status(200).json({
        success: true,
        config: {
          businessName: 'My Business',
          widgetColor: '#6366f1',
          greeting: "Hi! 👋 I'm the AI assistant. How can I help you today?",
        },
      });
    }

    return res.status(200).json({
      success: true,
      config: {
        businessName: config.businessName,
        businessInfo: config.businessInfo,
        faqs: config.faqs,
        widgetColor: config.widgetColor,
        greeting: config.greeting,
      },
    });
  } catch (err) {
    console.error('Config GET error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/config — protected (admin panel)
router.put('/', auth, async (req, res) => {
  try {
    const updates = req.body;

    let config = await Config.findOne();
    if (!config) {
      config = await Config.create(updates);
    } else {
      Object.assign(config, updates);
      await config.save();
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Config PUT error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
