const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const container = document.getElementById('chat-container');

let currentConversationId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Carrega o histórico ao carregar a página
    loadChatHistory();
});

async function loadChatHistory() {
    try {
        // Faz uma requisição GET para buscar o histórico no backend
        const res = await fetch('/history');
        if (res.ok) {
            const data = await res.json();
            // Verifica se há histórico e um ID de conversa
            if (data.history && data.history.length > 0 && data.conversationId) {
                currentConversationId = data.conversationId;
                // Adiciona cada mensagem do histórico na interface
                data.history.forEach(({ role, parts }) => {
                    const text = parts[0]?.text || '';
                    addMessage(text, role);
                });
                 // Rola para o final da conversa após carregar
                container.scrollTop = container.scrollHeight;
            }
        } else {
            console.warn('Falha ao carregar o histórico do chat. Status:', res.status);
            // Opcional: Adicionar uma mensagem na UI indicando que o histórico não pôde ser carregado
            // addMessage('Não foi possível carregar o histórico do chat.', 'model error');
        }
    } catch (error) {
        console.error('Erro ao carregar o histórico:', error);
         // Opcional: Adicionar uma mensagem na UI indicando um erro de conexão
         // addMessage('Erro de conexão ao carregar o histórico.', 'model error');
    }
}

// Função principal para enviar mensagem
async function sendMessage(userMessage) {
     // Adiciona a mensagem do usuário na interface imediatamente
    addMessage(userMessage, 'user');
    input.value = ''; // Limpa o input imediatamente
    container.scrollTop = container.scrollHeight; // Rola para o final para mostrar a mensagem enviada

    // Opcional: Adicionar um indicador visual de que o bot está pensando
    // const thinkingMessage = addMessage('...', 'model thinking'); // Precisaria de uma classe 'thinking' no CSS

    try {
        // Faz a requisição POST para o backend com a mensagem e o ID da conversa
        const res = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage, conversationId: currentConversationId })
        });

        // Verifica se a resposta HTTP foi bem-sucedida
        if (!res.ok) {
             // Tenta ler a mensagem de erro do backend, se disponível
             const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
             throw new Error(`Erro HTTP: ${res.status} - ${errorData.error || res.statusText}`);
        }

        const data = await res.json();
        const botReply = data.reply || 'Sem resposta.'; // Pega a resposta do bot ou um fallback

        // Opcional: Remover indicador de "pensando"
        // if (container.contains(thinkingMessage)) {
        //      container.removeChild(thinkingMessage);
        // }

        // Adiciona a resposta do bot na interface
        addMessage(botReply, 'model');
        currentConversationId = data.conversationId; // Atualiza o ID da conversa com o retornado pelo backend
        container.scrollTop = container.scrollHeight; // Rola para o final após a resposta do bot

    } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
        // Opcional: Remover indicador de "pensando" ou substituir por mensagem de erro
        // if (container.contains(thinkingMessage)) {
        //      container.removeChild(thinkingMessage);
        // }
        // Adiciona uma mensagem de erro visível na interface
        addMessage(`Erro: ${err.message || 'Ocorreu um problema ao enviar a mensagem.'}`, 'model error'); // Classe 'error' no CSS
        container.scrollTop = container.scrollHeight; // Rola para o final após a mensagem de erro
    }
}

// Adiciona um listener para o evento de submit do formulário
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Previne o recarregamento da página
    const userMessage = input.value.trim(); // Pega o valor do input e remove espaços em branco
    if (!userMessage) return; // Não faz nada se a mensagem estiver vazia

    sendMessage(userMessage); // Chama a função para enviar a mensagem
});

// Função para adicionar uma mensagem na interface do chat
function addMessage(text, sender) {
    const msgDiv = document.createElement('div'); // Cria um novo elemento div
    // Adiciona as classes 'message' e a classe do remetente ('user' ou 'model')
    msgDiv.classList.add('message', sender);
    // Define o texto da mensagem (textContent é mais seguro do que innerHTML para texto)
    msgDiv.textContent = text;
    // Adiciona a nova mensagem ao contêiner do chat
    container.appendChild(msgDiv);

    // A rolagem para o final foi movida para a função sendMessage
    // container.scrollTop = container.scrollHeight;

    // Retorna o elemento criado (útil se você quiser manipulá-lo depois, como um indicador de "digitando")
    return msgDiv;
}