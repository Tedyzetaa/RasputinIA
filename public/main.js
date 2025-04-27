const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const container = document.getElementById('chat-container');

let currentConversationId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadChatHistory();
});

async function loadChatHistory() {
    try {
        const res = await fetch('/history');
        if (res.ok) {
            const data = await res.json();
            if (data.history && data.history.length > 0 && data.conversationId) {
                currentConversationId = data.conversationId;
                data.history.forEach(({ role, parts }) => {
                    const sender = role === 'user' ? 'Você' : 'Bot';
                    const text = parts[0]?.text || '';
                    addMessage(text, role);
                });
            }
        } else {
            console.warn('Falha ao carregar o histórico do chat.');
        }
    } catch (error) {
        console.error('Erro ao carregar o histórico:', error);
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMessage = input.value.trim();
    if (!userMessage) return;

    addMessage(userMessage, 'user');
    input.value = '';

    try {
        const res = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage, conversationId: currentConversationId })
        });
        const data = await res.json();
        const botReply = data.reply || 'Sem resposta.';
        addMessage(botReply, 'model');
        currentConversationId = data.conversationId; // Atualiza o ID da conversa
    } catch (err) {
        console.error(err);
        addMessage('Erro ao conectar com o servidor.', 'model');
    }
});

function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    msgDiv.textContent = sender === 'user' ? text : text;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}