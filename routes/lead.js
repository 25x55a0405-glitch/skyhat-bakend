const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Lead = require('../models/Lead');
const Config = require('../models/Config');

// POST /api/lead
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, sessionId } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required',
      });
    }

    // Save lead
    const lead = await Lead.create({ name, phone, email, sessionId });

    // Send email notification (non-blocking, non-crashing)
    try {
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;

      if (!emailUser || !emailPass) {
        console.log('📧 EMAIL_USER or EMAIL_PASS not set — skipping email notification');
      } else {
        const config = await Config.findOne();
        const recipientEmail = config?.ownerEmail || emailUser;

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });

        await transporter.sendMail({
          from: `"SkyChat" <${emailUser}>`,
          to: recipientEmail,
          subject: `New Lead on your website — ${name}`,
          html: `
            <h2>🎉 New Lead Captured</h2>
            <table style="border-collapse:collapse; font-family:sans-serif;">
              <tr><td style="padding:8px; font-weight:bold;">Name</td><td style="padding:8px;">${name}</td></tr>
              <tr><td style="padding:8px; font-weight:bold;">Phone</td><td style="padding:8px;">${phone}</td></tr>
              <tr><td style="padding:8px; font-weight:bold;">Email</td><td style="padding:8px;">${email || 'N/A'}</td></tr>
              <tr><td style="padding:8px; font-weight:bold;">Time</td><td style="padding:8px;">${new Date().toLocaleString()}</td></tr>
              <tr><td style="padding:8px; font-weight:bold;">Session ID</td><td style="padding:8px;">${sessionId || 'N/A'}</td></tr>
            </table>
          `,
        });

        console.log(`📧 Lead notification email sent to ${recipientEmail}`);
      }
    } catch (emailErr) {
      console.error('📧 Email notification failed (non-fatal):', emailErr.message);
    }

    return res.status(201).json({
      success: true,
      leadId: lead._id,
    });
  } catch (err) {
    console.error('Lead creation error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
