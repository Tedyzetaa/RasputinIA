// routes/conversations.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const Conversation = require('../models/conversation');
const router = express.Router();

// Lista conversas da sessão
router.get('/', async (req, res, next) => {
  try {
    const conversations = await Conversation.findAll({
      where: { sessionId: req.sessionID },
      attributes: ['id','title','updatedAt'],
      order: [['updatedAt','DESC']]
    });
    res.json(conversations);
  } catch (err) {
    next(err);
  }
});

// Cria nova conversa
router.post('/',
  body('title').isString().trim().isLength({ min: 1, max: 100 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const newConv = await Conversation.create({
        sessionId: req.sessionID,
        title: req.body.title,
        messages: []
      });
      res.status(201).json({ id: newConv.id, title: newConv.title });
    } catch (err) {
      next(err);
    }
  }
);

// Histórico de uma conversa
router.get('/:id/history', async (req, res, next) => {
  try {
    const conv = await Conversation.findOne({
      where: { id: req.params.id, sessionId: req.sessionID }
    });
    if (!conv) return res.status(404).json({ error: 'Conversa não encontrada.' });
    res.json({ history: conv.messages, conversationId: conv.id });
  } catch (err) {
    next(err);
  }
});

// Exclui uma conversa
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await Conversation.destroy({
      where: { id: req.params.id, sessionId: req.sessionID }
    });
    if (!deleted) return res.status(404).json({ error: 'Conversa não encontrada.' });
    res.json({ message: 'Conversa excluída com sucesso.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

