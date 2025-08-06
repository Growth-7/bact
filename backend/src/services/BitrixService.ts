import axios from 'axios';
import { BitrixWebhookUrl } from '../config/BitrixWebhookUrl.js';
import { BitrixDealData } from './BitrixDealData.js';

export class BitrixDealResult {
  constructor(
    private readonly dealId: string,
    private readonly success: boolean
  ) {}

  getDealId(): string {
    return this.dealId;
  }

  isSuccess(): boolean {
    return this.success;
  }
}

export class BitrixService {
  private readonly webhookUrl: BitrixWebhookUrl;

  constructor(webhookUrl: string) {
    this.webhookUrl = new BitrixWebhookUrl(webhookUrl);
  }

  async createDeal(dealData: BitrixDealData): Promise<BitrixDealResult> {
    const url = this.buildCreateDealUrl();
    const payload = this.buildCreateDealPayload(dealData);

    try {
      const response = await axios.post(url, payload);
      return this.processCreateDealResponse(response);
    } catch (error) {
      throw new Error(`Erro ao criar deal no Bitrix24: ${error}`);
    }
  }

  async updateDeal(dealId: string, dealData: BitrixDealData): Promise<BitrixDealResult> {
    const url = this.buildUpdateDealUrl(dealId);
    const payload = this.buildUpdateDealPayload(dealData);

    try {
      const response = await axios.post(url, payload);
      return this.processUpdateDealResponse(response, dealId);
    } catch (error) {
      throw new Error(`Erro ao atualizar deal no Bitrix24: ${error}`);
    }
  }

  async addCommentToDeal(dealId: string, comment: string): Promise<void> {
    const url = this.buildAddCommentUrl();
    const payload = this.buildAddCommentPayload(dealId, comment);

    try {
      await axios.post(url, payload);
    } catch (error) {
      throw new Error(`Erro ao adicionar comentário no Bitrix24: ${error}`);
    }
  }

  private buildCreateDealUrl(): string {
    return `${this.webhookUrl.getBaseUrl()}/crm.deal.add.json`;
  }

  private buildUpdateDealUrl(dealId: string): string {
    return `${this.webhookUrl.getBaseUrl()}/crm.deal.update.json`;
  }

  private buildAddCommentUrl(): string {
    return `${this.webhookUrl.getBaseUrl()}/crm.timeline.comment.add.json`;
  }

  private buildCreateDealPayload(dealData: BitrixDealData): any {
    return {
      fields: dealData.toApiPayload()
    };
  }

  private buildUpdateDealPayload(dealData: BitrixDealData): any {
    return {
      fields: dealData.toApiPayload()
    };
  }

  private buildAddCommentPayload(dealId: string, comment: string): any {
    return {
      fields: {
        ENTITY_ID: dealId,
        ENTITY_TYPE: 'deal',
        COMMENT: comment
      }
    };
  }

  private processCreateDealResponse(response: any): BitrixDealResult {
    if (response.data && response.data.result) {
      const dealId = response.data.result.toString();
      return new BitrixDealResult(dealId, true);
    }
    
    throw new Error('Resposta inválida do Bitrix24 ao criar deal');
  }

  private processUpdateDealResponse(response: any, dealId: string): BitrixDealResult {
    if (response.data && response.data.result) {
      return new BitrixDealResult(dealId, true);
    }
    
    throw new Error('Resposta inválida do Bitrix24 ao atualizar deal');
  }
}
