export class BitrixWebhookUrl {
  private readonly webhookUrl: string;

  constructor(webhookUrl: string) {
    this.validateWebhookUrl(webhookUrl);
    this.webhookUrl = webhookUrl;
  }

  private validateWebhookUrl(url: string): void {
    if (!url) {
      throw new Error('Bitrix24 webhook URL é obrigatória');
    }
    
    if (!url.includes('bitrix24.com')) {
      throw new Error('URL deve ser um webhook válido do Bitrix24');
    }
  }

  getValue(): string {
    return this.webhookUrl;
  }

  getBaseUrl(): string {
    return this.webhookUrl.replace(/\/$/, '');
  }
}