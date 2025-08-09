export interface User {
  id: string;
  username: string;
  user_id_bitrix24: string;
}

export type SubmissionType = 'requerente' | 'familia';

export type LocationType = 'carrao' | 'alphaville';

export interface Family {
  id: string;
  name: string;
  members: string[];
  documentsCount: number;
}

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

export interface DocumentTypeOption {
  value: string;
  label: string;
}

export const DOCUMENT_TYPES: DocumentTypeOption[] = (
  Array.from(REQUERENTE_DOCUMENT_TYPES) as string[]
).map((name) => ({ value: name, label: name }));

export const FAMILY_DOCUMENT_TYPES: DocumentTypeOption[] = (
  Array.from(FAMILIA_DOCUMENT_TYPES) as string[]
).map((name) => ({ value: name, label: name }));

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

  // Campos auxiliares (para telas de listagem/preview)
  id?: string;
  category?: 'family' | 'requester';
  requesterName?: string;
  file?: File;
  fileName?: string;
  uploadDate?: Date;
  fileSize?: number;
  fileUrls?: string[];
}

// User/Profile stats
export interface UserStats {
  totalSubmissions: number;
  todayCount: number;
  currentStreak: number;
  longestStreak: number;
  dailyGoal: number;
  weeklyData: Array<{ date: string; count: number }>;
  totalUsers: number;
  rank: number;
}

export interface RankingUser {
  id?: string;
  username: string;
  totalSubmissions: number;
  currentStreak: number;
  todayCount: number;
  isCurrentUser?: boolean;
  rank?: number;
}
