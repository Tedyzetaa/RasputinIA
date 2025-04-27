// public/main.js

// elementos
const convListForm    = document.getElementById('new-conversation-form');
const convTitleInput  = document.getElementById('new-conversation-title');
const convList        = document.getElementById('conversations-list');
const form            = document.getElementById('chat-form');
const input           = document.getElementById('user-input');
const container       = document.getElementById('chat-container');

let currentConversationId = null;

// 1) Cria evento para o formulário de nova conversa
convListForm.addEventListener('submit', async e => {
  e.preventDefault();
  const title = convTitleInput.value.trim();
  if (!title) return;
  try {
    const newConv = await createConversation(title); // cria no BD
    convTitleInput.value = '';
    await loadConversations(); // Recarrega a lista para incluir a nova conversa
  } catch (err) {
    console.error(err);
    alert(`Erro ao criar conversa: ${err.message}`);
  }
});

// 2) Ao carregar a página, lista conversas
document.addEventListener('DOMContentLoaded', loadConversations);

async function loadConversations() {
  try {
        const res = await fetch('/conversations', { credentials: 'include' });
        if (!res.ok) {
             const json = await res.json().catch(() => ({}));
             throw new Error(json.error || 'Falha ao listar conversas');
        }
        const convos = await res.json();

        convList.innerHTML = ''; // Limpa a lista atual
        if (convos.length === 0) {
            console.log("Nenhuma conversa encontrada. Criando uma padrão.");
            await createConversation('Nova Conversa');
            return loadConversations(); // Tenta carregar novamente após criar
        }

        convos.forEach(c => {
            addConversationToList(c); // Usa a função para adicionar cada item (incluindo o botão delete)
        });

        // seleciona a primeira, se ainda não houver seleção (ao carregar a página)
        // ou re-seleciona a ativa se ela existir na nova lista
        const activeConvExists = convos.some(c => c.id === currentConversationId);

        if (!currentConversationId || !activeConvExists) {
             if (convos.length > 0) {
                 // Seleciona o primeiro item (agora uma div)
                 selectConversation(convos[0].id, convList.querySelector('.conversation-item'));
             } else {
                 // Nenhuma conversa restante mesmo após tentar criar uma padrão
                 container.innerHTML = '';
                 addMessage('Nenhuma conversa disponível. Crie uma nova!', 'model');
             }
        } else {
             // Mantém a conversa ativa selecionada visualmente e carrega seu histórico se necessário
             // Procura o item (div) pelo seu data-conversation-id
             selectConversation(currentConversationId, document.querySelector(`.conversations-list .conversation-item[data-conversation-id='${currentConversationId}']`));
        }


    } catch (err) {
        console.error("Erro em loadConversations:", err);
        convList.innerHTML = '<div style="color: red; padding: 10px;">Erro ao carregar conversas.</div>';
        container.innerHTML = ''; // Limpa o chat em caso de erro
         addMessage('Não foi possível carregar a lista de conversas.', 'model error');
    }
}

async function createConversation(title) {
  try {
        const res = await fetch('/conversations', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(json.error || `Erro HTTP ${res.status}`);
        }
        return json; // Retorna o objeto da nova conversa com id e title
    } catch (err) {
        console.error("Erro em createConversation:", err);
        throw new Error(err.message || 'Erro ao criar conversa');
    }
}

// Função para adicionar um item de conversa à lista na UI, usando DIV como contêiner
function addConversationToList(conv) {
    if (!conv || (!conv.id && !conv.error)) return;

    // Cria uma DIV como contêiner do item da conversa
    const convItem = document.createElement('div');
    convItem.classList.add('conversation-item');
    convItem.dataset.conversationId = conv.id; // Armazena o ID

    // Cria o span para o título
    const titleSpan = document.createElement('span');
    titleSpan.textContent = conv.title || `Conversa ${conv.id}`; // Usa título ou ID
    convItem.appendChild(titleSpan);

    // Adiciona a classe ativa se for a conversa atual
    if (conv.id === currentConversationId) {
        convItem.classList.add('active');
    }

    // Adiciona evento de clique para selecionar a conversa (agora na DIV)
    convItem.addEventListener('click', (event) => {
        // Se o clique veio do botão de exclusão, não seleciona a conversa
        if (event.target.classList.contains('delete-conv-btn') || event.target.closest('.delete-conv-btn')) {
            return;
        }
        selectConversation(conv.id, convItem); // Passa a DIV como itemElement
    });

    // Adiciona o botão de excluir (continua sendo um botão)
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-conv-btn');
    deleteBtn.innerHTML = '✖'; // Usando X ou um ícone
    deleteBtn.title = 'Excluir Conversa'; // Tooltip

    // Adiciona evento de clique para excluir a conversa
    deleteBtn.addEventListener('click', async (event) => {
        event.stopPropagation(); // Impede que o clique no botão de excluir ative o listener da DIV
        const confirmDelete = confirm(`Tem certeza que deseja excluir a conversa "${conv.title || `Conversa ${conv.id}`}?"`);
        if (confirmDelete) {
            await deleteConversation(conv.id, convItem); // Passa a DIV como convItemElement
        }
    });

    convItem.appendChild(deleteBtn); // Adiciona o botão de excluir à DIV

    convList.appendChild(convItem); // Adiciona a DIV à lista no HTML
}

// Nova função para excluir uma conversa no backend e atualizar a UI
async function deleteConversation(conversationIdToDelete, convItemElement) {
    try {
        const res = await fetch(`/conversations/${conversationIdToDelete}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.error || `Erro HTTP ${res.status} ao excluir conversa`);
        }

        // Remove o item da lista na UI
        convItemElement.remove();

        // Se a conversa excluída era a ativa, limpa o chat e seleciona outra (a primeira disponível)
        if (currentConversationId === conversationIdToDelete) {
            currentConversationId = null; // Desdefine a conversa ativa
            container.innerHTML = ''; // Limpa o chat
            addMessage('Conversa excluída.', 'model'); // Mensagem de feedback

            // Tenta selecionar a primeira conversa restante após um pequeno atraso
            setTimeout(() => {
                 // Procura o primeiro item (div)
                 const remainingConversations = convList.querySelector('.conversation-item');
                 if (remainingConversations) {
                     selectConversation(remainingConversations.dataset.conversationId, remainingConversations);
                 } else {
                      // Nenhuma conversa restante
                      container.innerHTML = '';
                      addMessage('Crie sua primeira conversa na barra lateral!', 'model');
                 }
            }, 50); // Pequeno atraso


        }
        console.log(`Conversa ${conversationIdToDelete} excluída.`);

    } catch (error) {
        console.error("Erro em deleteConversation:", error);
        alert(`Erro ao excluir conversa: ${error.message}`);
    }
}


async function selectConversation(id, itemElement) { // Renomeado btn para itemElement para clareza
    // Verifica se já está na conversa e se o chat não tem erro (para não impedir recarregar após erro)
    if (currentConversationId === id && container.innerHTML !== '' && !container.querySelector('.message.error')) {
        console.log(`Conversa ${id} já selecionada.`);
        // Apenas garante que a classe ativa esteja correta
        convList.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
        if(itemElement) itemElement.classList.add('active');
        return;
    }

    currentConversationId = id;
    convList.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
    if(itemElement) itemElement.classList.add('active'); // Garante que o item clicado fique ativo

    container.innerHTML = ''; // Limpa o chat atual
    // Opcional: Adicionar um indicador de carregamento
    // container.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">Carregando histórico...</div>';


    try {
        const res = await fetch(`/conversations/${id}/history`, { credentials: 'include' });
        if (res.status === 404) throw new Error('Conversa não encontrada no backend');
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.error || `Falha HTTP ${res.status} ao carregar histórico`);
        }
        const data = await res.json(); // Recebe o objeto { history: ..., conversationId: ... }
        const history = data.history; // Extrai o array history

        // --- Adicionando Logs de Depuração ---
        console.log(`[DEBUG HISTORICO] Tipo de history NO FRONTEND após fetch: ${typeof history}`);
        console.log(`[DEBUG HISTORICO] Valor de history NO FRONTEND após fetch:`, history);
        // Se for um array, você pode querer logar o tamanho
        if (Array.isArray(history)) {
            console.log(`[DEBUG HISTORICO] NO FRONTEND: É um array com ${history.length} itens.`);
        } else {
             console.error(`[DEBUG HISTORICO] ERRO: 'history' não é um array no frontend! Tipo: ${typeof history}`, history);
        }
        // --- Fim dos Logs de Depuração ---


        if (!history || history.length === 0) { // Verifica se é falsy ou vazio
             container.innerHTML = ''; // Limpa de novo se não houver histórico
             addMessage('Esta conversa está vazia. Comece a digitar!', 'model');
        } else {
             container.innerHTML = ''; // Limpa antes de adicionar mensagens
             // AQUI É ONDE O .filter() ESTÁ SENDO CHAMADO
             history
                .filter(m => m.role !== 'system') // <-- Se history não for array, dá erro aqui
                .forEach(({ role, parts }) => addMessage(parts[0]?.text || '', role));
        }

        container.scrollTop = container.scrollHeight;

    } catch (err) {
        console.error("Erro em selectConversation/loadHistory:", err);
        container.innerHTML = '';
        addMessage(`❗ ${err.message}`, 'error');
    }
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!currentConversationId) {
    return alert('Escolha ou crie uma conversa primeiro.');
  }

  const text = input.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  input.value = '';
  container.scrollTop = container.scrollHeight;

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, conversationId: currentConversationId })
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

    addMessage(json.reply, 'model');
    container.scrollTop = container.scrollHeight;
  } catch (err) {
    console.error(err);
    addMessage(`❗ ${err.message}`, 'error');
  }
});

// Função para adicionar uma mensagem na interface do chat
function addMessage(text, sender) {
  const msg = document.createElement('div');
  msg.classList.add('message');
  sender.split(' ').forEach(cls => cls && msg.classList.add(cls));

  // Lógica para adicionar o nome do bot, adaptada para ser mais robusta
  if (sender.includes('model')) {
     const botName = typeof window !== 'undefined' && window.IA_NAME ? window.IA_NAME : 'Bot';
     text = `${botName}: ${text}`;
  }

  msg.textContent = text; // Usar textContent é mais seguro
  container.appendChild(msg);
  return msg;
}