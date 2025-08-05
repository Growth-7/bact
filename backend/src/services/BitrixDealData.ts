export class BitrixDealTitle {
  private readonly title: string;

  constructor(title: string) {
    this.validateTitle(title);
    this.title = title;
  }

  private validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Título do deal é obrigatório');
    }
  }

  getValue(): string {
    return this.title;
  }
}

export class BitrixDealStage {
  private readonly stageId: string;

  constructor(stageId: string = 'NEW') {
    this.stageId = stageId;
  }

  getValue(): string {
    return this.stageId;
  }
}

export class BitrixDealData {
  private readonly title: BitrixDealTitle;
  private readonly stage: BitrixDealStage;
  private readonly comments: string;
  private readonly fields: Map<string, string>;

  constructor(
    title: string,
    comments: string = '',
    customFields: Record<string, string> = {}
  ) {
    this.title = new BitrixDealTitle(title);
    this.stage = new BitrixDealStage();
    this.comments = comments;
    this.fields = new Map(Object.entries(customFields));
  }

  getTitle(): string {
    return this.title.getValue();
  }

  getStage(): string {
    return this.stage.getValue();
  }

  getComments(): string {
    return this.comments;
  }

  addCustomField(key: string, value: string): void {
    this.fields.set(key, value);
  }

  getCustomFields(): Record<string, string> {
    return Object.fromEntries(this.fields);
  }

  toApiPayload(): any {
    return {
      TITLE: this.getTitle(),
      STAGE_ID: this.getStage(),
      COMMENTS: this.getComments(),
      ...this.getCustomFields()
    };
  }
}