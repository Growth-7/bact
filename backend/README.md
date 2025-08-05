# BACT Backend

Backend completo para o sistema BACT com integração Google Drive, Bitrix24 e Supabase.

## ✅ Funcionalidades Implementadas

### 🗄️ Banco de Dados
- ✅ Conexão com Supabase (PostgreSQL)
- ✅ Modelos Prisma para Users, Submissions e SubmissionFields
- ✅ Operações CRUD completas
- ✅ Relacionamentos entre tabelas

### 🌐 Google Drive
- ✅ Autenticação via Service Account
- ✅ Upload de arquivos para pasta compartilhada
- ✅ Validação de tipos de arquivo
- ✅ Geração de links de visualização

### 🔗 Bitrix24
- ✅ Criação automática de deals
- ✅ Atualização de deals existentes
- ✅ Adição de comentários
- ✅ Campos customizados

### 🚀 API Endpoints
- ✅ `POST /api/submissions` - Criar nova submissão com upload
- ✅ `GET /api/submissions/user/:userId` - Listar submissões do usuário
- ✅ `GET /api/submissions/:submissionId` - Buscar submissão específica
- ✅ `GET /health/database` - Status da conexão com banco

## 🛠️ Setup e Instalação

### 1. Instalar Dependências
\`\`\`bash
cd bact/backend
npm install
\`\`\`

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` baseado no `.env.example`:

\`\`\`bash
# Substitua [YOUR-PASSWORD] pela senha real do Supabase
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@cydczmozquzbvogwcxuz.supabase.co:5432/postgres"
SHADOW_DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@cydczmozquzbvogwcxuz.supabase.co:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://cydczmozquzbvogwcxuz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZGN6bW96cXV6YnZvZ3djeHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNTQ0OTksImV4cCI6MjA2OTkzMDQ5OX0.e4HthzkrcgXMDQn0VlD2--qBellTBERjB6YtiUQHxFU"

BITRIX24_WEBHOOK_URL="https://eunaeuropacidadania.bitrix24.com.br/rest/10/ss2ea4l539tlv1fv/"

PORT=3333
NODE_ENV=development
\`\`\`

### 3. Configurar Banco de Dados
\`\`\`bash
# Gerar cliente Prisma
npm run prisma:generate

# Executar migrações
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio
npm run prisma:studio
\`\`\`

### 4. Executar em Desenvolvimento
\`\`\`bash
npm run dev
\`\`\`

O servidor estará disponível em: `http://localhost:3333`

## 📁 Estrutura do Projeto

\`\`\`
backend/
├── src/
│   ├── config/
│   │   ├── BitrixWebhookUrl.ts       # Configuração URL Bitrix24
│   │   ├── DatabaseConnection.ts     # Singleton conexão Prisma
│   │   ├── GoogleDriveCredentials.ts # Credenciais Google Drive
│   │   ├── GoogleDriveFolderId.ts    # ID da pasta Google Drive
│   │   └── SecretsReader.ts          # Leitor do secrets.toml
│   ├── controllers/
│   │   └── SubmissionController.ts   # Controller principal API
│   ├── middleware/
│   │   └── FileUploadMiddleware.ts   # Middleware upload arquivos
│   ├── models/
│   │   └── SubmissionData.ts         # Modelos de dados da submissão
│   ├── services/
│   │   ├── BitrixDealData.ts         # Dados para Bitrix24
│   │   ├── BitrixService.ts          # Serviço integração Bitrix24
│   │   ├── DatabaseService.ts        # Serviço operações banco
│   │   └── GoogleDriveService.ts     # Serviço upload Google Drive
│   └── server.ts                     # Servidor Express principal
├── prisma/
│   └── schema.prisma                 # Schema do banco de dados
├── package.json
└── README.md
\`\`\`

## 🔒 Object Calisthenics Aplicado

O código segue rigorosamente as regras de Object Calisthenics:

1. ✅ **Apenas um nível de indentação por método**
2. ✅ **Nunca usar else** 
3. ✅ **Encapsular todos os tipos primitivos** (strings em classes específicas)
4. ✅ **Envolver coleções em classes**
5. ✅ **Usar apenas um ponto por linha** (Lei de Demeter)
6. ✅ **Não abreviar nomes de variáveis e métodos**

## 🧪 Testando a API

### Criar Submissão
\`\`\`bash
curl -X POST http://localhost:3333/api/submissions \\
  -F "username=lucas" \\
  -F "location=Lisboa" \\
  -F "submissionType=Residência" \\
  -F "documentType=Passaporte" \\
  -F "customFields={\"cpf\":\"123456789\",\"telefone\":\"912345678\"}" \\
  -F "file=@documento.pdf"
\`\`\`

### Verificar Status do Banco
\`\`\`bash
curl http://localhost:3333/health/database
\`\`\`

## 🚀 Deploy em Produção

1. Configure as variáveis de ambiente no seu provedor de hosting
2. Execute: `npm run build`
3. Execute: `npm run prisma:deploy`
4. Execute: `npm start`

## 📝 Notas Importantes

- ⚠️ Substitua `[YOUR-PASSWORD]` pela senha real do Supabase
- ⚠️ O arquivo `secrets.toml` deve estar no diretório raiz do projeto
- ⚠️ Certifique-se de que a pasta do Google Drive existe e está compartilhada
- ⚠️ Verifique se o webhook do Bitrix24 está ativo