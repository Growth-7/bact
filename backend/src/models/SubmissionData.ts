import { SubmissionStatus as PrismaSubmissionStatus } from '@prisma/client';

// Utilizando classes para encapsular os tipos primitivos e coleções,
// seguindo as regras de Object Calisthenics.

class SubmissionLocation {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) throw new Error('Localização é obrigatória');
  }
  getValue(): string { return this.value; }
}

class SubmissionType {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) throw new Error('Tipo de submissão é obrigatório');
  }
  getValue(): string { return this.value; }
}

class DocumentType {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) throw new Error('Tipo de documento é obrigatório');
  }
  getValue(): string { return this.value; }
}

class FileUrls {
  constructor(private readonly values: string[]) {
    if (!values || values.some(url => !url || url.trim().length === 0)) {
      // Permite array vazio inicialmente
    }
  }
  getValues(): string[] { return this.values; }
}

class SubmissionStatus {
  constructor(private readonly value: PrismaSubmissionStatus = PrismaSubmissionStatus.PENDING) {}
  getValue(): PrismaSubmissionStatus { return this.value; }
}

class NomeFamilia {
    constructor(private readonly value: string) {}
    getValue(): string { return this.value; }
}

class IdFamilia {
    constructor(private readonly value: string) {}
    getValue(): string { return this.value; }
}

class NomeRequerente {
    constructor(private readonly value: string | undefined) {}
    getValue(): string | undefined { return this.value; }
}

class IdRequerente {
    constructor(private readonly value: string | undefined) {}
    getValue(): string | undefined { return this.value; }
}

export class SubmissionData {
  private readonly location: SubmissionLocation;
  private readonly submissionType: SubmissionType;
  private readonly documentType: DocumentType;
  private readonly fileUrls: FileUrls;
  private readonly status: SubmissionStatus;
  private bitrixDealId?: string;
  private readonly nomeFamilia: NomeFamilia;
  private readonly idFamilia: IdFamilia;
  private readonly nomeRequerente: NomeRequerente;
  private readonly idRequerente: IdRequerente;


  constructor(
    location: string,
    submissionType: string,
    documentType: string,
    fileUrls: string[],
    nomeFamilia: string,
    idFamilia: string,
    nomeRequerente?: string,
    idRequerente?: string,
  ) {
    this.location = new SubmissionLocation(location);
    this.submissionType = new SubmissionType(submissionType);
    this.documentType = new DocumentType(documentType);
    this.fileUrls = new FileUrls(fileUrls);
    this.status = new SubmissionStatus();
    this.nomeFamilia = new NomeFamilia(nomeFamilia);
    this.idFamilia = new IdFamilia(idFamilia);
    this.nomeRequerente = new NomeRequerente(nomeRequerente);
    this.idRequerente = new IdRequerente(idRequerente);
  }

  getLocation(): string { return this.location.getValue(); }
  getSubmissionType(): string { return this.submissionType.getValue(); }
  getDocumentType(): string { return this.documentType.getValue(); }
  getFileUrls(): string[] { return this.fileUrls.getValues(); }
  getStatus(): PrismaSubmissionStatus { return this.status.getValue(); }
  getBitrixDealId(): string | undefined { return this.bitrixDealId; }
  setBitrixDealId(dealId: string): void { this.bitrixDealId = dealId; }
  getNomeFamilia(): string { return this.nomeFamilia.getValue(); }
  getIdFamilia(): string { return this.idFamilia.getValue(); }
  getNomeRequerente(): string | undefined { return this.nomeRequerente.getValue(); }
  getIdRequerente(): string | undefined { return this.idRequerente.getValue(); }
}
