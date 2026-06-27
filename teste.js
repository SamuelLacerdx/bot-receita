require('dotenv').config();

console.log('TOKEN:', process.env.TELEGRAM_TOKEN);
console.log('ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT);
console.log('DEPLOY:', process.env.AZURE_OPENAI_DEPLOYMENT);