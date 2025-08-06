# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app

# Copia os arquivos de configuração
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Instala as dependências de produção
RUN npm install --omit=dev

# Copia o restante do código fonte
COPY . .

# Gera o cliente Prisma
RUN npx prisma generate

# Builda a aplicação
RUN npm run build

# Stage 2: Produção
FROM node:20-slim
WORKDIR /app

ENV NODE_ENV=production

# Copia as dependências da etapa de build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copia o código compilado
COPY --from=builder /app/dist ./dist

# Copia o schema do Prisma para a imagem final
COPY --from=builder /app/prisma ./prisma

# Expõe a porta
EXPOSE 3333

# Comando para iniciar a aplicação
CMD ["node", "dist/src/server.js"]
