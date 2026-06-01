const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Chat = require('../models/Chat');
const Config = require('../models/Config');

// Initialize OpenAI client pointing to OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { message, sessionId, leadId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Message and sessionId are required',
      });
    }

    // Load business config
    const config = await Config.findOne();
    const businessName = config?.businessName || 'My Business';
    const businessInfo = config?.businessInfo || '';
    const faqs = config?.faqs || [];

    // Build FAQ string
    const faqText = faqs
      .map((f, i) => `Q${i + 1}: ${f.q}\nA${i + 1}: ${f.a}`)
      .join('\n');

    // Build system prompt
    const systemPrompt = `You are a helpful AI assistant for ${businessName}.
Business info: ${businessInfo}
FAQs:
${faqText}
Rules: Be friendly, concise, and helpful. Always respond in the same language the user writes in. If asked about pricing or appointments, tell them a team member will follow up. Never make up information not in the business info. If you don't know something, say: I'll connect you with our team.`;

    // Find or create chat session
    let chat = await Chat.findOne({ sessionId });
    if (!chat) {
      chat = new Chat({ sessionId, leadId: leadId || null, messages: [] });
    } else if (leadId && !chat.leadId) {
      chat.leadId = leadId;
    }

    // Append user message
    chat.messages.push({
      role: 'user',
      content: message,
      ts: new Date(),
    });

    // Build messages array for AI (system + conversation history)
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...chat.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    // Call AI via OpenRouter
    let aiReply = '';
    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENROUTER_MODEL || 'z-ai/glm-4.5-air:free',
        max_tokens: 300,
        messages: aiMessages,
      });

      aiReply =
        completion.choices?.[0]?.message?.content?.trim() ||
        "I'm sorry, I couldn't process that. Please try again.";
    } catch (aiErr) {
      console.error('AI API error:', aiErr.message);
      aiReply =
        "I'm having trouble connecting right now. Please try again in a moment, or I'll connect you with our team.";
    }

    // Append assistant response
    chat.messages.push({
      role: 'assistant',
      content: aiReply,
      ts: new Date(),
    });

    await chat.save();

    return res.status(200).json({
      success: true,
      reply: aiReply,
      sessionId,
    });
  } catch (err) {
    console.error('Chat error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'AI error',
    });
  }
});

module.exports = router;
