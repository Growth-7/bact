export class SubmissionLocation {
  private readonly location: string;

  constructor(location: string) {
    this.validateLocation(location);
    this.location = location;
  }

  private validateLocation(location: string): void {
    if (!location || location.trim().length === 0) {
      throw new Error('Localização é obrigatória');
    }
  }

  getValue(): string {
    return this.location;
  }
}

export class SubmissionType {
  private readonly submissionType: string;

  constructor(submissionType: string) {
    this.validateSubmissionType(submissionType);
    this.submissionType = submissionType;
  }

  private validateSubmissionType(type: string): void {
    if (!type || type.trim().length === 0) {
      throw new Error('Tipo de submissão é obrigatório');
    }
  }

  getValue(): string {
    return this.submissionType;
  }
}

export class DocumentType {
  private readonly documentType: string;

  constructor(documentType: string) {
    this.validateDocumentType(documentType);
    this.documentType = documentType;
  }

  private validateDocumentType(type: string): void {
    if (!type || type.trim().length === 0) {
      throw new Error('Tipo de documento é obrigatório');
    }
  }

  getValue(): string {
    return this.documentType;
  }
}

export class FileUrl {
  private readonly fileUrl: string;

  constructor(fileUrl: string) {
    this.validateFileUrl(fileUrl);
    this.fileUrl = fileUrl;
  }

  private validateFileUrl(url: string): void {
    if (!url || url.trim().length === 0) {
      throw new Error('URL do arquivo é obrigatória');
    }
  }

  getValue(): string {
    return this.fileUrl;
  }
}

export class FileType {
  private readonly fileType: string;

  constructor(fileType: string) {
    this.validateFileType(fileType);
    this.fileType = fileType;
  }

  private validateFileType(type: string): void {
    if (!type || type.trim().length === 0) {
      throw new Error('Tipo do arquivo é obrigatório');
    }
  }

  getValue(): string {
    return this.fileType;
  }
}

export class SubmissionStatus {
  private readonly status: string;

  constructor(status: string = 'Pending') {
    this.status = status;
  }

  getValue(): string {
    return this.status;
  }

  isPending(): boolean {
    return this.status === 'Pending';
  }

  isProcessed(): boolean {
    return this.status === 'Processed';
  }

  isFailed(): boolean {
    return this.status === 'Failed';
  }
}

export class SubmissionData {
  private readonly location: SubmissionLocation;
  private readonly submissionType: SubmissionType;
  private readonly documentType: DocumentType;
  private readonly fileUrl: FileUrl;
  private readonly fileType: FileType;
  private readonly status: SubmissionStatus;
  private readonly fields: Map<string, string>;
  private bitrixDealId?: string;

  constructor(
    location: string,
    submissionType: string,
    documentType: string,
    fileUrl: string,
    fileType: string,
    customFields: Record<string, string> = {}
  ) {
    this.location = new SubmissionLocation(location);
    this.submissionType = new SubmissionType(submissionType);
    this.documentType = new DocumentType(documentType);
    this.fileUrl = new FileUrl(fileUrl);
    this.fileType = new FileType(fileType);
    this.status = new SubmissionStatus();
    this.fields = new Map(Object.entries(customFields));
  }

  getLocation(): string {
    return this.location.getValue();
  }

  getSubmissionType(): string {
    return this.submissionType.getValue();
  }

  getDocumentType(): string {
    return this.documentType.getValue();
  }

  getFileUrl(): string {
    return this.fileUrl.getValue();
  }

  getFileType(): string {
    return this.fileType.getValue();
  }

  getStatus(): string {
    return this.status.getValue();
  }

  getBitrixDealId(): string | undefined {
    return this.bitrixDealId;
  }

  setBitrixDealId(dealId: string): void {
    this.bitrixDealId = dealId;
  }

  addCustomField(key: string, value: string): void {
    this.fields.set(key, value);
  }

  getCustomFields(): Record<string, string> {
    return Object.fromEntries(this.fields);
  }

  getCustomFieldsAsArray(): Array<{ key: string; value: string }> {
    return Array.from(this.fields.entries()).map(([key, value]) => ({
      key,
      value
    }));
  }
}