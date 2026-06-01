const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    q: { type: String, default: '' },
    a: { type: String, default: '' },
  },
  { _id: false }
);

const configSchema = new mongoose.Schema({
  businessName: {
    type: String,
    default: 'My Business',
  },
  businessInfo: {
    type: String,
    default: 'We are a local business. Contact us for more info.',
  },
  faqs: {
    type: [faqSchema],
    default: [],
  },
  widgetColor: {
    type: String,
    default: '#6366f1',
  },
  greeting: {
    type: String,
    default: 'Hi! 👋 I\'m the AI assistant. How can I help you today?',
  },
  ownerPhone: {
    type: String,
    default: '',
  },
  ownerEmail: {
    type: String,
    default: '',
  },
  adminPin: {
    type: String,
    default: '',
  },
});

module.exports = mongoose.model('Config', configSchema);

