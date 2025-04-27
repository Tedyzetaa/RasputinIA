const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const sequelize = require('./database');
const Conversation = require('./models/conversation');

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const sessionSecret = process.env.SESSION_SECRET;

if (!apiKey) {
    console.error("Erro Crítico: GEMINI_API_KEY não encontrada no arquivo .env");
    process.exit(1);
}
if (!sessionSecret) {
    console.warn("Aviso: SESSION_SECRET não encontrada no arquivo .env. Usando um segredo padrão inseguro.");
    console.warn("Por favor, defina um SESSION_SECRET forte no seu arquivo .env para produção.");
}

const app = express();
const port = process.env.PORT || 3000;

app.use(session({
    secret: sessionSecret || 'fallback-insecure-secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: 'auto',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());

const genAI = new GoogleGenerativeAI(apiKey);

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest", // Ou "gemini-pro"
    safetySettings,
});

console.log("Modelo Gemini configurado:", model.model);
console.log("Configurações de segurança:", safetySettings.map(s => `${s.category}: ${s.threshold}`));

app.get('/history', async (req, res) => {
    const sessionId = req.sessionID;
    try {
        const conversation = await Conversation.findOne({ where: { sessionId } });
        if (conversation) {
            res.json({ history: conversation.messages, conversationId: conversation.id });
        } else {
            res.json({ history: [], conversationId: null });
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        res.status(500).json({ error: 'Erro ao carregar o histórico do chat.' });
    }
});

app.post('/chat', async (req, res) => {
    const sessionId = req.sessionID;
    const { message: userMessage, conversationId } = req.body;

    if (!userMessage) {
        return res.status(400).json({ error: 'Nenhuma mensagem fornecida.' });
    }

    let currentConversation;

    try {
        if (conversationId) {
            currentConversation = await Conversation.findByPk(conversationId);
            if (!currentConversation || currentConversation.sessionId !== sessionId) {
                console.warn(`[${sessionId}] Tentativa de acessar conversa inválida ou inexistente: ${conversationId}`);
                currentConversation = await Conversation.create({ messages: [], sessionId });
            }
        } else {
            currentConversation = await Conversation.create({ messages: [], sessionId });
        }

        const chat = model.startChat({
            history: currentConversation.messages,
        });

        const result = await chat.sendMessage(userMessage);
        const response = result.response;

        if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content) {
            console.warn(`[${sessionId}] Resposta da Gemini bloqueada ou vazia. Feedback:`, response?.promptFeedback);
            let blockReason = "A resposta foi bloqueada por razões de segurança ou estava vazia.";
            if (response?.promptFeedback?.blockReason) {
                blockReason = `A resposta foi bloqueada devido a: ${response.promptFeedback.blockReason}`;
            }
            return res.status(500).json({ error: blockReason });
        }

        const botReply = response.text();
        const newMessagePair = { role: "user", parts: [{ text: userMessage }] };
        const newBotMessage = { role: "model", parts: [{ text: botReply }] };

        currentConversation.messages = [...currentConversation.messages, newMessagePair, newBotMessage];
        await currentConversation.save();

        res.json({ reply: botReply, conversationId: currentConversation.id });

    } catch (error) {
        console.error(`[${sessionId}] Erro ao processar mensagem:`, error);
        res.status(500).json({ error: 'Erro ao processar a mensagem.' });
    }
});

app.use(express.static('public'));
console.log("Servindo arquivos estáticos da pasta 'public'");

sequelize.sync().then(() => {
    app.listen(port, () => {
        console.log(`-------------------------------------------------------`);
        console.log(` Servidor rodando em http://localhost:${port}`);
        console.log(` Endpoint do Chat (POST): /chat`);
        console.log(` Endpoint do Histórico (GET): /history`);
        console.log(` Servindo frontend de: ./public`);
        console.log(` Banco de dados MySQL sincronizado.`);
        console.log(`-------------------------------------------------------`); // Adicionei esta linha para fechar o log
    });
});