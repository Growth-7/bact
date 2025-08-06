/**
 * Script de Debug para Google Service Account
 * 
 * Este script ajuda a diagnosticar problemas com a autenticação do Google Service Account.
 * Execute com: node debug-google-auth.cjs
 */

require('dotenv').config();

function debugGoogleAuth() {
  console.log('🔍 DIAGNÓSTICO DO GOOGLE SERVICE ACCOUNT');
  console.log('========================================\n');

  // Verificar se as variáveis estão definidas
  const requiredVars = [
    'GOOGLE_SERVICE_ACCOUNT_TYPE',
    'GOOGLE_SERVICE_ACCOUNT_PROJECT_ID', 
    'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID',
    'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
    'GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL',
    'GOOGLE_SERVICE_ACCOUNT_CLIENT_ID',
    'GOOGLE_SERVICE_ACCOUNT_AUTH_URI',
    'GOOGLE_SERVICE_ACCOUNT_TOKEN_URI',
    'GOOGLE_DRIVE_FOLDER_ID'
  ];

  console.log('1. VERIFICANDO VARIÁVEIS DE AMBIENTE:');
  console.log('-------------------------------------');
  
  const missingVars = [];
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName}: NÃO DEFINIDA`);
      missingVars.push(varName);
    } else {
      if (varName === 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY') {
        console.log(`✅ ${varName}: DEFINIDA (${value.length} caracteres)`);
        // Mostrar apenas os primeiros e últimos caracteres
        console.log(`   Início: ${value.substring(0, 50)}...`);
        console.log(`   Fim: ...${value.substring(value.length - 50)}`);
      } else {
        console.log(`✅ ${varName}: ${value}`);
      }
    }
  }

  if (missingVars.length > 0) {
    console.log(`\n❌ VARIÁVEIS FALTANDO: ${missingVars.join(', ')}`);
    return;
  }

  console.log('\n2. ANALISANDO CHAVE PRIVADA:');
  console.log('-----------------------------');
  
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  
  console.log(`Tamanho original: ${privateKey.length} caracteres`);
  console.log(`Contém \\n: ${privateKey.includes('\\n')}`);
  console.log(`Contém \\\\n: ${privateKey.includes('\\\\n')}`);
  console.log(`Contém quebras reais: ${privateKey.includes('\n')}`);
  console.log(`Começa com BEGIN: ${privateKey.includes('-----BEGIN PRIVATE KEY-----')}`);
  console.log(`Termina com END: ${privateKey.includes('-----END PRIVATE KEY-----')}`);

  // Processar a chave como no código
  console.log('\n3. PROCESSANDO CHAVE PRIVADA:');
  console.log('------------------------------');
  
  let processedKey = privateKey;

  // Remove aspas se estiverem presentes
  if (processedKey.startsWith('"') && processedKey.endsWith('"')) {
    processedKey = processedKey.slice(1, -1);
    console.log('✅ Removidas aspas duplas');
  }
  if (processedKey.startsWith("'") && processedKey.endsWith("'")) {
    processedKey = processedKey.slice(1, -1);
    console.log('✅ Removidas aspas simples');
  }

  // Tenta detectar se é Base64
  if (!processedKey.includes('-----BEGIN') && processedKey.length > 100 && /^[A-Za-z0-9+/=]+$/.test(processedKey)) {
    console.log('🔍 Detectado possível formato Base64, tentando decodificar...');
    try {
      const decoded = Buffer.from(processedKey, 'base64').toString('utf-8');
      if (decoded.includes('-----BEGIN PRIVATE KEY-----')) {
        processedKey = decoded;
        console.log('✅ Chave decodificada de Base64 com sucesso');
      }
    } catch (error) {
      console.log('⚠️  Falha ao decodificar Base64, continuando com formato original');
    }
  }

  // Processar escapes
  if (processedKey.includes('\\\\n')) {
    processedKey = processedKey.replace(/\\\\n/g, '\n');
    console.log('✅ Convertido \\\\n para \\n');
  } else if (processedKey.includes('\\n')) {
    processedKey = processedKey.replace(/\\n/g, '\n');
    console.log('✅ Convertido \\n para quebras reais');
  }

  // Reformatar se necessário
  if (!processedKey.includes('\n') && processedKey.length > 100) {
    if (processedKey.includes('-----BEGIN PRIVATE KEY----- ') && processedKey.includes(' -----END PRIVATE KEY-----')) {
      console.log('⚠️  Detectado formato com espaços, tentando reformatar...');
      const parts = processedKey.split(' ');
      let reformatted = '';
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === '-----BEGIN' && parts[i + 1] === 'PRIVATE' && parts[i + 2] === 'KEY-----') {
          reformatted += '-----BEGIN PRIVATE KEY-----\n';
          i += 2;
        } else if (parts[i] === '-----END' && parts[i + 1] === 'PRIVATE' && parts[i + 2] === 'KEY-----') {
          reformatted += '-----END PRIVATE KEY-----';
          i += 2;
        } else if (parts[i] && parts[i].length > 0) {
          reformatted += parts[i] + '\n';
        }
      }
      processedKey = reformatted;
      console.log('✅ Chave reformatada');
    }
  }

  // Normalizar
  processedKey = processedKey
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  console.log(`\nChave processada:`)
  console.log(`- Tamanho: ${processedKey.length} caracteres`);
  console.log(`- Linhas: ${processedKey.split('\n').length}`);
  console.log(`- Começa corretamente: ${processedKey.startsWith('-----BEGIN PRIVATE KEY-----')}`);
  console.log(`- Termina corretamente: ${processedKey.endsWith('-----END PRIVATE KEY-----')}`);

  // Mostrar as primeiras e últimas linhas
  const lines = processedKey.split('\n');
  console.log(`\nPrimeiras 3 linhas:`);
  lines.slice(0, 3).forEach((line, i) => console.log(`  ${i + 1}: ${line}`));
  
  console.log(`\nÚltimas 3 linhas:`);
  lines.slice(-3).forEach((line, i) => console.log(`  ${lines.length - 2 + i}: ${line}`));

  console.log('\n4. TESTANDO AUTENTICAÇÃO:');
  console.log('-------------------------');
  
  try {
    const { google } = require('googleapis');
    
    const credentials = {
      type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
      project_id: process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID,
      private_key_id: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
      private_key: processedKey,
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
      auth_uri: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_URI,
      token_uri: process.env.GOOGLE_SERVICE_ACCOUNT_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL
    };

    console.log('✅ Credenciais criadas com sucesso');

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    console.log('✅ GoogleAuth criado com sucesso');

    // Teste assíncrono de token
    auth.getAccessToken()
      .then(token => {
        console.log('✅ Token obtido com sucesso!');
        console.log(`Token: ${token.substring(0, 20)}...`);
        console.log('\n🎉 AUTENTICAÇÃO FUNCIONANDO CORRETAMENTE!');
      })
      .catch(error => {
        console.log('❌ Erro ao obter token:', error.message);
        if (error.message.includes('DECODER routines')) {
          console.log('\n💡 DICA: O erro DECODER routines indica problema no formato da chave privada.');
          console.log('   Verifique se a chave está sendo passada corretamente para o Coolify.');
        }
      });

  } catch (error) {
    console.log('❌ Erro na criação da autenticação:', error.message);
  }
}

debugGoogleAuth();

