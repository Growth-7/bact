import { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import { DatabaseConnection } from '../config/DatabaseConnection.js';
import axios from 'axios';
import { isUUID } from 'class-validator';

const prisma = DatabaseConnection.getInstance();

const getValidationApiHeaders = () => {
  const VALIDATION_API_KEY = process.env.VALIDATION_SUPABASE_ANON_KEY;
  const VALIDATION_SERVICE_KEY = process.env.VALIDATION_SUPABASE_SERVICE_ROLE_KEY;
  if (!VALIDATION_API_KEY || !VALIDATION_SERVICE_KEY) {
    throw new Error('A configuração da API de validação está incompleta no servidor.');
  }
  return {
    'apikey': VALIDATION_API_KEY,
    'Authorization': `Bearer ${VALIDATION_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };
};

export class AuthController {
  async register(req: Request, res: Response): Promise<Response | void> {
    const { username, password, user_id_bitrix24 } = req.body;
    if (!username || !password || !user_id_bitrix24) {
      return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }
    try {
      const existingUser = await prisma.user.findFirst({ where: { OR: [{ username }, { user_id_bitrix24 }] } });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Usuário ou ID Bitrix24 já cadastrado.' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({ data: { username, password: hashedPassword, user_id_bitrix24 } });
      return res.status(201).json({ success: true, user: { id: user.id, username: user.username } });
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
  }

  async login(req: Request, res: Response): Promise<Response | void> {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Nome de usuário e senha são obrigatórios.' });
    }
    try {
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user || !user.password) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado ou senha não configurada.' });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Senha incorreta.' });
      }
      return res.status(200).json({ success: true, user: { id: user.id, username: user.username, user_id_bitrix24: user.user_id_bitrix24 } });
    } catch (error) {
      console.error('Erro no login:', error);
      return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
  }

  async validateIds(req: Request, res: Response): Promise<Response | void> {
    const { familyId, applicantId } = req.body;
    if (familyId && !isUUID(familyId)) {
      return res.status(400).json({ success: false, field: 'familyId', message: 'Formato de ID da Família inválido.' });
    }
    if (applicantId && !isUUID(applicantId)) {
      return res.status(400).json({ success: false, field: 'applicantId', message: 'Formato de ID do Requerente inválido.' });
    }
    try {
      const headers = getValidationApiHeaders();
      const VALIDATION_FUNCTION_URL = `${process.env.VALIDATION_SUPABASE_URL}/functions/v1/validation_ids`;
      const body = { familia_id: familyId, customer_id: applicantId };
      const { data } = await axios.post(VALIDATION_FUNCTION_URL, body, { headers });
      if (data.exists) {
        return res.status(200).json({ success: true, message: 'IDs validados com sucesso.' });
      } else {
        return res.status(404).json({ success: false, message: 'ID não encontrado.' });
      }
    } catch (error) {
      console.error('Erro na validação de IDs via Edge Function:', error);
      return res.status(500).json({ success: false, message: 'Erro ao comunicar com o serviço de validação.' });
    }
  }

  async getFamilyMembers(req: Request, res: Response): Promise<Response | void> {
    const { familyId } = req.params;
    if (!isUUID(familyId)) {
      return res.status(400).json({ success: false, message: 'Formato de ID da Família inválido.' });
    }
    try {
      const headers = getValidationApiHeaders();
      const API_URL = process.env.VALIDATION_SUPABASE_URL;
      const { data } = await axios.get(
        `${API_URL}/customer?select=id,slug&familia_id=eq.${familyId}`,
        { headers }
      );
      if (!data) {
        return res.status(404).json({ success: false, message: 'Nenhum membro encontrado para esta família.' });
      }
      const members = data.map((member: any) => ({
        id: member.id,
        name: member.slug,
      }));
      return res.status(200).json({ success: true, members });
    } catch (error) {
      console.error('Erro ao buscar membros da família:', error);
      return res.status(500).json({ success: false, message: 'Erro ao buscar membros da família.' });
    }
  }
}
