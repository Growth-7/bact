export interface User {
  id: string;
  username: string;
}

export interface DocumentSubmission {
  location: 'carrao' | 'alphaville';
  submissionType: 'certidao' | 'requerente' | 'familia';
  
  // Campos para certidão
  familyId?: string;
  applicantId?: string;
  
  // Campos para requerente
  requesterName?: string;
  
  // Campos para família
  familyName?: string;
  
  documentType: 'birth' | 'marriage' | 'death';
  file: File | null;
}

export type DocumentType = {
  value: 'birth' | 'marriage' | 'death';
  label: string;
};

export const DOCUMENT_TYPES: DocumentType[] = [
  { value: 'birth', label: 'Certidão de Nascimento' },
  { value: 'marriage', label: 'Certidão de Casamento' },
  { value: 'death', label: 'Certidão de Óbito' }
];

export type SubmissionType = {
  value: 'certidao' | 'requerente' | 'familia';
  label: string;
};

export const SUBMISSION_TYPES: SubmissionType[] = [
  { value: 'certidao', label: 'Envio de Certidão' },
  { value: 'requerente', label: 'Requerente' },
  { value: 'familia', label: 'Família' }
];