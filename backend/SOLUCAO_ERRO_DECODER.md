# 🔧 Solução para Erro DECODER routines::unsupported

## 📋 Resumo do Problema

O erro `Error: error:1E08010C:DECODER routines::unsupported` estava ocorrendo na autenticação do Google Service Account no ambiente Coolify. Este erro indica que a chave privada não estava sendo decodificada corretamente.

## ✅ Soluções Implementadas

### 1. **Processamento Robusto da Chave Privada**

Implementamos um sistema que tenta múltiplas estratégias de decodificação:

- **Remoção de aspas**: Remove aspas duplas/simples que podem envolver a chave
- **Decodificação Base64**: Detecta e decodifica chaves em formato Base64
- **Múltiplos formatos de escape**: Suporta `\n`, `\\n`, e `\\\\n`
- **Reformatação de espaços**: Converte espaços em quebras de linha quando necessário
- **Normalização**: Remove espaços extras e padroniza o formato

### 2. **Logs Detalhados**

Adicionamos logs extensivos para facilitar o diagnóstico:
- Status de cada etapa do processamento
- Detecção automática do formato da chave
- Validação em tempo real
- Mensagens de erro mais específicas

### 3. **Script de Diagnóstico**

Criamos o arquivo `debug-google-auth.cjs` para testar a configuração:

```bash
cd backend
node debug-google-auth.cjs
```

## 🚀 Como Testar

### 1. **No Ambiente Local**

```bash
cd backend
node debug-google-auth.cjs
```

### 2. **No Coolify**

1. Faça o deploy da versão atualizada
2. Verifique os logs do container para ver as mensagens de diagnóstico
3. Teste uma submissão para verificar se o upload funciona

## 🔍 Formatos Suportados da Chave Privada

A solução agora suporta múltiplos formatos:

### Formato Padrão (recomendado)
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
...
-----END PRIVATE KEY-----
```

### Formato com Escape
```
"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n...-----END PRIVATE KEY-----"
```

### Formato Base64
```
LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUVBZ0lCQUFOQmdrcWhraUc5dzBCQVFFRkFBU0NCSTBFQVFFQQo...
```

### Formato com Espaços
```
-----BEGIN PRIVATE KEY----- MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC ... -----END PRIVATE KEY-----
```

## ⚠️ Configuração no Coolify

### Variáveis de Ambiente Necessárias

Certifique-se de que todas estas variáveis estão definidas no Coolify:

- `GOOGLE_SERVICE_ACCOUNT_TYPE` (normalmente "service_account")
- `GOOGLE_SERVICE_ACCOUNT_PROJECT_ID`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` ⚠️ **MAIS IMPORTANTE**
- `GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_CLIENT_ID`
- `GOOGLE_SERVICE_ACCOUNT_AUTH_URI`
- `GOOGLE_SERVICE_ACCOUNT_TOKEN_URI`
- `GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL`
- `GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL`
- `GOOGLE_DRIVE_FOLDER_ID`

### Dicas para a Chave Privada no Coolify

1. **Sem Aspas Extras**: Não adicione aspas manuais no Coolify
2. **Formato Original**: Use o formato exato do arquivo JSON do Google
3. **Base64 (alternativa)**: Se ainda der problema, codifique a chave em Base64:
   ```bash
   echo "sua-chave-aqui" | base64
   ```

## 🧪 Verificação de Funcionamento

Após o deploy, procure por estas mensagens nos logs:

### ✅ Sucesso
```
🔍 Processando chave privada. Tamanho original: 1704
✅ Convertido \n para quebras de linha
✅ Chave processada com sucesso. Linhas: 28
✅ Todas as credenciais do Google Service Account estão definidas
```

### ❌ Problema
```
❌ Chave privada inválida. Primeiros 100 chars: ...
❌ Contém BEGIN: false
❌ Contém PRIVATE: false
```

## 📞 Próximos Passos

1. **Deploy imediato**: Faça o deploy desta versão corrigida
2. **Verifique logs**: Monitore os logs durante o primeiro teste
3. **Teste submissão**: Faça uma submissão de teste para validar
4. **Remova debug**: Após confirmar funcionamento, posso remover os logs de debug se desejar

A solução agora é robusta o suficiente para lidar com diferentes formatos de chave privada que podem ocorrer em ambientes como Coolify/Docker.
