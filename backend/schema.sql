-- Arquivo SQL para criação das tabelas do projeto BACT
-- Compatível com PostgreSQL (Supabase)

-- Tabela de Usuários
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Envios de Documentos
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "location" TEXT NOT NULL,
    "submissionType" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "bitrixDealId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabela para os campos dinâmicos dos envios
CREATE TABLE "SubmissionField" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    CONSTRAINT "SubmissionField_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ---
-- Índices para otimização de consultas
-- ---
CREATE INDEX "Submission_userId_idx" ON "Submission"("userId");
CREATE INDEX "SubmissionField_submissionId_idx" ON "SubmissionField"("submissionId");

-- ---
-- Função e Gatilho (Trigger) para atualizar o campo "updatedAt" automaticamente
-- ---
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON "Submission"
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

COMMENT ON TABLE "User" IS 'Armazena informações dos usuários que fazem login no sistema.';
COMMENT ON TABLE "Submission" IS 'Registro principal para cada envio de documento, contendo metadados e status.';
COMMENT ON TABLE "SubmissionField" IS 'Armazena os campos e valores dinâmicos de cada envio (ex: familyId, requesterName).';
