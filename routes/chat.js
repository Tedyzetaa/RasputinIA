// routes/chat.js
require('dotenv').config();
const express = require('express');
const { body, validationResult } = require('express-validator');
const Conversation = require('../models/conversation');
const logger = require('../logger');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// Configuração de autenticação para Google Generative AI
let genAI;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Usa credenciais de service account via Application Default Credentials
  genAI = new GoogleGenerativeAI();
  logger.info('GoogleGenerativeAI: usando GOOGLE_APPLICATION_CREDENTIALS para autenticação.');
} else if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
  // Usa API Key diretamente
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  genAI = new GoogleGenerativeAI({ apiKey });
  logger.info('GoogleGenerativeAI: usando API Key para autenticação.');
} else {
  logger.error('Nenhuma credencial válida encontrada: defina GOOGLE_APPLICATION_CREDENTIALS ou GEMINI_API_KEY / GOOGLE_API_KEY no .env.');
  process.exit(1);
}

// Configuração de safety
const safetySettings = [
  { category: HarmCategory.HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
];
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest', safetySettings });

const router = express.Router();

// Endpoint de chat
router.post('/',
  body('message').isString().trim().notEmpty(),
  body('conversationId').isInt(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message: userMessage, conversationId } = req.body;
    const sessionId = req.sessionID;

    try {
      const conv = await Conversation.findOne({ where: { id: conversationId, sessionId } });
      if (!conv) {
        return res.status(404).json({ error: 'Conversa não encontrada.' });
      }

      // Inicia o chat com histórico
      const chat = model.startChat({ history: conv.messages || [] });
      let result;
      try {
        result = await chat.sendMessage(userMessage);
      } catch (aiError) {
        logger.error('Falha em chat.sendMessage:', aiError);
        return res.status(500).json({ error: 'Falha ao chamar o modelo AI: ' + aiError.message });
      }

      // Checa resposta válida
      if (!result.response?.candidates?.length) {
        return res.status(500).json({ error: 'Resposta vazia ou bloqueada pelo safety.' });
      }
      const botReply = result.response.text();

      // Atualiza histórico no banco
      conv.messages.push({ role: 'user', parts: [{ text: userMessage }] });
      conv.messages.push({ role: 'model', parts: [{ text: botReply }] });
      await conv.save();

      res.json({ reply: botReply, conversationId: conv.id });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
