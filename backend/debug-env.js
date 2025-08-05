// debug-env.js
const path = require('path');
const fs = require('fs');

console.log('--- Iniciando Depurador de Ambiente ---');

const envPath = path.resolve(__dirname, '.env');

console.log(`Procurando arquivo .env em: ${envPath}`);

if (!fs.existsSync(envPath)) {
  console.error('ERRO FATAL: O arquivo .env não foi encontrado neste diretório.');
  process.exit(1);
}

console.log('Arquivo .env encontrado. Tentando carregar com dotenv...');

// Carrega as variáveis do arquivo .env
require('dotenv').config({ path: envPath, debug: true });

console.log('\n--- Variáveis de Ambiente em process.env ---');

console.log(`DATABASE_URL: ${process.env.DATABASE_URL || 'NÃO ENCONTRADA'}`);
console.log(`SHADOW_DATABASE_URL: ${process.env.SHADOW_DATABASE_URL || 'NÃO ENCONTRADA'}`);
console.log(`BITRIX24_WEBHOOK_URL: ${process.env.BITRIX24_WEBHOOK_URL || 'NÃO ENCONTRADA'}`);
console.log(`GOOGLE_DRIVE_FOLDER_ID: ${process.env.GOOGLE_DRIVE_FOLDER_ID || 'NÃO ENCONTRADA'}`);

console.log('\n--- Fim da Depuração ---');
