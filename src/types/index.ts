export interface User {
  id: string;
  username: string;
  user_id_bitrix24: string;
}

export type SubmissionType = 'requerente' | 'familia';

export type LocationType = 'carrao' | 'alphaville';

export const REQUERENTE_DOCUMENT_TYPES = [
  'Certidão de Nascimento',
  'Certidão de Casamento',
  'Certidão de Óbito',
  'Outro',
] as const;

export const FAMILIA_DOCUMENT_TYPES = [
  'Certidão do Italiano',
  'CNN',
  'Procuração',
] as const;

export type RequerenteDocumentType = typeof REQUERENTE_DOCUMENT_TYPES[number];
export type FamiliaDocumentType = typeof FAMILIA_DOCUMENT_TYPES[number];
export type DocumentType = RequerenteDocumentType | FamiliaDocumentType;

export interface DocumentSubmission {
  location: LocationType;
  submissionType: SubmissionType;
  
  // Campos para Requerente
  nomeRequerente?: string;
  idRequerente?: string;

  // Campos compartilhados ou de Família
  nomeFamilia?: string;
  idFamilia?: string;
  
  documentType?: DocumentType;
  files: File[];
}
