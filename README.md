# RasputinIA

Chatbot web com histórico persistente, integrado à API Google Gemini (Gemini 1.5), Node.js/Express e Sequelize/MySQL.

---

## Funcionalidades

- **Chat em tempo real** com animações e tema personalizado
- **Histórico** de mensagens por sessão (armazenado em MySQL)
- **Back-end** em Express + Sequelize
- **Front-end** em HTML/CSS/JS puro
- Indicadores de “pensando”, tratamento de erros, scroll suave

---

## Pré-requisitos

- Node.js ≥ 14
- MySQL
- Conta Google Generative AI e chave `GEMINI_API_KEY`
- (Opcional) ngrok, se quiser expor local

---

## Instalação

1. **Clone** o repositório:
   ```bash
   git clone https://github.com/seu-usuario/RasputinIA.git
   cd RasputinIA
   ```

2. **Instale** dependências:
   ```bash
   npm install
   ```

3. **Configure** o arquivo `.env` na raiz:
   ```ini
   GEMINI_API_KEY=seu_token_gemini
   SESSION_SECRET=um_segredo_forte
   DB_HOST=localhost
   DB_USER=usuario_mysql
   DB_PASS=senha_mysql
   DB_NAME=nome_do_bd
   PORT=3000
   ```

4. **Inicie** o servidor (Sequelize cria as tabelas automaticamente):
   ```bash
   npm start
   ```

5. **Acesse** no navegador:
   ```
   http://localhost:3000
   ```

---

## Endpoints

- `GET /history`  
  Retorna o histórico da sessão atual:
  ```json
  { history: [ /* mensagens */ ], conversationId: <id> }
  ```

- `POST /chat`  
  Envia `{ message: string, conversationId: number|null }` e recebe:
  ```json
  { reply: string, conversationId: number }
  ```

---

## Estrutura de Pastas

```plaintext
RasputinIA/
│
├── models/              # Model Sequelize (Conversation)
├── public/              # Front-end
│   ├── index.html
│   ├── style.css
│   ├── main.js
│   └── img/
│       └── wallpaper.jpg
│
├── src/                 # Código fonte (app.js)
├── database.js          # Configuração do Sequelize
├── server.js            # Servidor Express + rotas /chat e /history
├── .env                 # Variáveis de ambiente
├── package.json
└── scripts/             # .bat, ngrok, etc.
```

---

## Uso com ngrok (opcional)

Para expor seu servidor local:
```bash
ngrok http 3000
```
Atualize o front-end para usar o domínio `ngrok` gerado.

---

## Tecnologias

- Node.js, Express, Sequelize, MySQL
- Google Generative AI (Gemini)
- HTML5, CSS3 (Flex/Grid, animações), JavaScript ES6+

---

## Licença

MIT

