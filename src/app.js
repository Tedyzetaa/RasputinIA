// src/app.js
const express = require('express');
const sequelize = require('../database'); // Importa a instância do Sequelize configurada
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware para habilitar o CORS
app.use(cors());

// Middleware para analisar o corpo das requisições como JSON
app.use(express.json());

// Rota de exemplo para verificar se o servidor está rodando
app.get('/', (req, res) => {
  res.send('Servidor Node.js com Express e Sequelize rodando!');
});

// Rota para testar a conexão com o banco de dados
app.get('/test-db', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).send('Conexão com o banco de dados estabelecida com sucesso!');
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    res.status(500).send('Erro ao conectar ao banco de dados.');
  }
});

// Inicializa o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});