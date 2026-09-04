# Bot Receita — Bot de Turismo para Telegram

Bot para Telegram voltado a turismo, hospedado na **Azure** e utilizando o **Azure AI Foundry** para gerar respostas inteligentes aos usuários.

## ✨ Funcionalidades

- Interação com usuários via Telegram
- Respostas e recomendações de turismo geradas com IA (Azure AI Foundry)
- Backend hospedado na nuvem (Azure)

## 🛠️ Tecnologias utilizadas

- Node.js
- Telegram Bot API
- Azure (hospedagem)
- Azure AI Foundry (inteligência artificial)

## 🚀 Como executar o projeto

1. Clone o repositório:
   ```bash
   git clone https://github.com/SamuelLacerdx/bot-receita.git
   ```
2. Acesse a pasta do projeto:
   ```bash
   cd bot-receita
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Configure as variáveis de ambiente. Copie o arquivo de modelo e preencha com suas credenciais:
   ```bash
   cp .env.modelo .env
   ```
5. Inicie o servidor:
   ```bash
   node server.js
   ```

## 🔑 Variáveis de ambiente

O arquivo `.env.modelo` traz o modelo de configuração necessário:

```env
# Token do bot no Telegram (obtido via @BotFather)
TELEGRAM_TOKEN=

# Endpoint do recurso Azure OpenAI (ex: https://SEU-RECURSO.openai.azure.com/openai/responses)
AZURE_OPENAI_ENDPOINT=

# Chave de API do Azure OpenAI
AZURE_API_KEY=

# Nome do deployment do modelo no Azure OpenAI
AZURE_OPENAI_DEPLOYMENT=
```

| Variável | Descrição |
| --- | --- |
| `TELEGRAM_TOKEN` | Token do bot gerado pelo [@BotFather](https://t.me/BotFather) no Telegram |
| `AZURE_OPENAI_ENDPOINT` | Endpoint do recurso Azure OpenAI / Azure AI Foundry |
| `AZURE_API_KEY` | Chave de API para autenticação no Azure OpenAI |
| `AZURE_OPENAI_DEPLOYMENT` | Nome do deployment do modelo configurado no Azure AI Foundry |

## 📁 Estrutura do projeto

```
bot-receita/
├── server.js           # Ponto de entrada da aplicação / lógica do bot
├── teste.js             # Arquivo de testes
├── .env.modelo          # Modelo das variáveis de ambiente
├── package.json
└── package-lock.json
```

## 📌 Versão do projeto

Projeto Finalizado.
