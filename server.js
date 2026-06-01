require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const nodemailer = require('nodemailer');
const connectDB = require('./db/mongoose');
const Config = require('./models/Config');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────
app.use(express.json());
app.use(morgan('dev'));

// CORS: allow CORS_ORIGIN from env + wildcard for widget embeds
const corsOptions = {
  origin: (origin, callback) => {
    const allowed = process.env.CORS_ORIGIN || '';
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow the configured origin
    if (allowed && origin === allowed) return callback(null, true);
    // Allow all origins for widget embeds
    return callback(null, true);
  },
  credentials: true,
};
app.use(cors(corsOptions));

// ─── Routes ───────────────────────────────────────────────
app.use('/api/chat', require('./routes/chat'));
app.use('/api/lead', require('./routes/lead'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/config', require('./routes/config'));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'SkyChat Backend', timestamp: new Date().toISOString() });
});

// ─── Startup ──────────────────────────────────────────────
const startServer = async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Seed default Config if none exists
  try {
    const existingConfig = await Config.findOne();
    if (!existingConfig) {
      await Config.create({
        businessName: 'My Business',
        businessInfo: 'We are a local business. Contact us for more info.',
        faqs: [
          {
            q: 'What are your hours?',
            a: 'We are open 9am to 6pm Monday to Saturday.',
          },
        ],
        widgetColor: '#6366f1',
        greeting: "Hi! 👋 I'm the AI assistant. How can I help you today?",
        ownerPhone: '',
        ownerEmail: process.env.EMAIL_USER || '',
      });
      console.log('🌱 Default Config seeded');
    } else {
      console.log('✅ Config already exists');
    }
  } catch (err) {
    console.error('⚠  Config seed error:', err.message);
  }

  // 3. Verify Nodemailer transporter
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (emailUser && emailPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: emailUser, pass: emailPass },
      });

      await transporter.verify();
      console.log('📧 Email transporter verified — ready to send');
    } else {
      console.warn('⚠  EMAIL_USER or EMAIL_PASS not set — email notifications disabled');
    }
  } catch (err) {
    console.warn('⚠  Email transporter verification failed:', err.message);
    console.warn('   Email notifications may not work, but server will continue.');
  }

  // 4. Start listening
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`\n🚀 SkyChat backend running on port ${PORT} ✓`);
      console.log(`   Model: ${process.env.OPENROUTER_MODEL || 'z-ai/glm-4.5-air:free'}`);
      console.log(`   CORS:  ${process.env.CORS_ORIGIN || '*'}\n`);
    });
  } else {
    console.log('⚡ Running in Serverless/Vercel environment - skipping app.listen');
  }
};

if (process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('❌ Serverless startup error:', err);
  });
} else {
  startServer().catch((err) => {
    console.error('❌ Fatal startup error:', err);
    process.exit(1);
  });
}

module.exports = app;
