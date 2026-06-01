const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Lead = require('../models/Lead');
const Chat = require('../models/Chat');
const Config = require('../models/Config');

// GET /api/admin/leads — all leads, newest first
router.get('/leads', auth, async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, leads });
  } catch (err) {
    console.error('Admin leads error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/admin/chats — all chats or filtered by sessionId
router.get('/chats', auth, async (req, res) => {
  try {
    const { sessionId } = req.query;

    let chats;
    if (sessionId) {
      chats = await Chat.find({ sessionId }).populate('leadId');
    } else {
      chats = await Chat.find().sort({ createdAt: -1 }).populate('leadId');
    }

    return res.status(200).json({ success: true, chats });
  } catch (err) {
    console.error('Admin chats error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/admin/stats — dashboard statistics
router.get('/stats', auth, async (req, res) => {
  try {
    // Start of today (midnight UTC)
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const [totalLeads, totalChats, leadsToday, chatsToday] = await Promise.all([
      Lead.countDocuments(),
      Chat.countDocuments(),
      Lead.countDocuments({ createdAt: { $gte: startOfToday } }),
      Chat.countDocuments({ createdAt: { $gte: startOfToday } }),
    ]);

    return res.status(200).json({
      success: true,
      totalLeads,
      totalChats,
      leadsToday,
      chatsToday,
    });
  } catch (err) {
    console.error('Admin stats error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/admin/config — secure configuration fetch
router.get('/config', auth, async (req, res) => {
  try {
    const config = await Config.findOne();
    return res.status(200).json({ success: true, config });
  } catch (err) {
    console.error('Admin config GET error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

