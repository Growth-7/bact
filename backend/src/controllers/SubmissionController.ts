import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { GoogleDriveService, GoogleDriveFileData } from '../services/GoogleDriveService';
import { BitrixService } from '../services/BitrixService';
import { BitrixDealData } from '../services/BitrixDealData';
import { SubmissionData } from '../models/SubmissionData';

export class SubmissionController {
  private readonly databaseService: DatabaseService;
  private readonly googleDriveService: GoogleDriveService;
  private readonly bitrixService: BitrixService;

  constructor() {
    this.databaseService = new DatabaseService();
    this.googleDriveService = new GoogleDriveService();
    
    const bitrixWebhookUrl = process.env.BITRIX24_WEBHOOK_URL || 
      'https://eunaeuropacidadania.bitrix24.com.br/rest/10/ss2ea4l539tlv1fv/';
    this.bitrixService = new BitrixService(bitrixWebhookUrl);
  }

  async handleSubmission(req: Request, res: Response): Promise<void> {
    try {
      const requestData = this.extractRequestData(req);
      const uploadedFile = this.extractUploadedFile(req);
      
      const userId = await this.ensureUserExists(requestData.username);
      
      const googleDriveResult = await this.uploadToGoogleDrive(uploadedFile);
      
      const submissionData = this.createSubmissionData(requestData, googleDriveResult.getWebViewLink());
      
      const databaseResult = await this.databaseService.createSubmission(userId, submissionData);
      
      const bitrixResult = await this.createBitrixDeal(submissionData);
      
      await this.databaseService.updateSubmissionBitrixId(
        databaseResult.getSubmissionId(),
        bitrixResult.getDealId()
      );

      await this.databaseService.updateSubmissionStatus(
        databaseResult.getSubmissionId(),
        'Processed'
      );

      this.sendSuccessResponse(res, {
        submissionId: databaseResult.getSubmissionId(),
        bitrixDealId: bitrixResult.getDealId(),
        fileUrl: googleDriveResult.getWebViewLink()
      });

    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  async getSubmissionsByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        this.sendBadRequestResponse(res, 'ID do usuário é obrigatório');
        return;
      }

      const submissions = await this.databaseService.findSubmissionsByUserId(userId);
      
      res.json({
        success: true,
        data: submissions
      });

    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  async getSubmissionById(req: Request, res: Response): Promise<void> {
    try {
      const { submissionId } = req.params;
      
      if (!submissionId) {
        this.sendBadRequestResponse(res, 'ID da submissão é obrigatório');
        return;
      }

      const submission = await this.databaseService.findSubmissionById(submissionId);
      
      if (!submission) {
        this.sendNotFoundResponse(res, 'Submissão não encontrada');
        return;
      }

      res.json({
        success: true,
        data: submission
      });

    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  private extractRequestData(req: Request): any {
    return {
      username: req.body.username,
      location: req.body.location,
      submissionType: req.body.submissionType,
      documentType: req.body.documentType,
      customFields: JSON.parse(req.body.customFields || '{}')
    };
  }

  private extractUploadedFile(req: Request): any {
    if (!req.file) {
      throw new Error('Arquivo é obrigatório');
    }
    return req.file;
  }

  private async ensureUserExists(username: string): Promise<string> {
    if (!username) {
      throw new Error('Nome de usuário é obrigatório');
    }
    return await this.databaseService.createUser(username);
  }

  private async uploadToGoogleDrive(file: any): Promise<any> {
    const fileData = new GoogleDriveFileData(
      file.originalname,
      file.mimetype,
      file.buffer
    );
    
    return await this.googleDriveService.uploadFile(fileData);
  }

  private createSubmissionData(requestData: any, fileUrl: string): SubmissionData {
    const submissionData = new SubmissionData(
      requestData.location,
      requestData.submissionType,
      requestData.documentType,
      fileUrl,
      'file' // file type placeholder
    );

    for (const [key, value] of Object.entries(requestData.customFields)) {
      submissionData.addCustomField(key, value as string);
    }

    return submissionData;
  }

  private async createBitrixDeal(submissionData: SubmissionData): Promise<any> {
    const dealTitle = `${submissionData.getDocumentType()} - ${submissionData.getLocation()}`;
    const dealComments = `Submissão de documento: ${submissionData.getSubmissionType()}`;
    
    const dealData = new BitrixDealData(dealTitle, dealComments, submissionData.getCustomFields());
    
    return await this.bitrixService.createDeal(dealData);
  }

  private sendSuccessResponse(res: Response, data: any): void {
    res.status(201).json({
      success: true,
      message: 'Submissão processada com sucesso',
      data: data
    });
  }

  private sendErrorResponse(res: Response, error: any): void {
    console.error('Erro na submissão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }

  private sendBadRequestResponse(res: Response, message: string): void {
    res.status(400).json({
      success: false,
      message: message
    });
  }

  private sendNotFoundResponse(res: Response, message: string): void {
    res.status(404).json({
      success: false,
      message: message
    });
  }
}