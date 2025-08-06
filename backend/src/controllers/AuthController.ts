import { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { DatabaseConnection } from '../config/DatabaseConnection.js';
import axios from 'axios';
import { isUUID } from 'class-validator';

const prisma = DatabaseConnection.getInstance();

const getValidationApiConfig = () => {
  const projectUrl = process.env.VALIDATION_SUPABASE_PROJECT_URL;
  const anonKey = process.env.VALIDATION_SUPABASE_ANON_KEY;
  const serviceKey = process.env.VALIDATION_SUPABASE_SERVICE_ROLE_KEY;

  if (!projectUrl || !anonKey || !serviceKey) {
    throw new Error('A configuração da API de validação Supabase está incompleta no servidor.');
  }

  return {
    restUrl: `${projectUrl}/rest/v1`,
    functionsUrl: `${projectUrl}/functions/v1`,
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
  };
};

export class AuthController {
  async register(req: Request, res: Response): Promise<Response | void> {
    const { username, password, user_id_bitrix24, birth_date } = req.body;
    if (!username || !password || !user_id_bitrix24 || !birth_date) {
      return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }
    try {
      const existingUser = await prisma.user.findFirst({ where: { OR: [{ username }, { user_id_bitrix24 }] } });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Usuário ou ID Bitrix24 já cadastrado.' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          user_id_bitrix24,
          birth_date: new Date(birth_date),
        },
      });
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

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          user_id_bitrix24: user.user_id_bitrix24,
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );

      return res.status(200).json({ success: true, token });
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
      const { functionsUrl, headers } = getValidationApiConfig();
      const body = { familia_id: familyId, customer_id: applicantId };
      const { data } = await axios.post(`${functionsUrl}/validation_ids`, body, { headers });
      
      if (data.exists) {
        return res.status(200).json({ success: true, message: 'IDs validados com sucesso.' });
      } else {
        return res.status(404).json({ success: false, message: 'ID não encontrado.' });
      }
    } catch (error: any) {
      console.error('Erro na validação de IDs via Edge Function:', error.response?.data || error.message);
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || 'Erro ao comunicar com o serviço de validação.';
      return res.status(status).json({ success: false, error: message });
    }
  }

  async getFamilyMembers(req: Request, res: Response): Promise<Response | void> {
    const { familyId } = req.params;
    if (!isUUID(familyId)) {
      return res.status(400).json({ success: false, message: 'Formato de ID da Família inválido.' });
    }
    try {
      const { restUrl, headers } = getValidationApiConfig();
      const { data } = await axios.get(
        `${restUrl}/customer?select=id,slug&familia_id=eq.${familyId}`,
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

  async addRequerente(req: Request, res: Response): Promise<Response | void> {
    const { nome, familia_id } = req.body;
    if (!nome || !familia_id) {
      return res.status(400).json({ success: false, message: 'Nome e ID da família são obrigatórios.' });
    }
    if (!isUUID(familia_id)) {
      return res.status(400).json({ success: false, message: 'Formato de ID da Família inválido.' });
    }

    try {
      const { functionsUrl, headers } = getValidationApiConfig();
      const response = await axios.post(
        `${functionsUrl}/addRequerente`,
        { nome, familia_id },
        { headers }
      );

      return res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error('Erro ao adicionar requerente via Edge Function:', error.response?.data || error.message);
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || 'Erro ao comunicar com o serviço de validação.';
      return res.status(status).json({ success: false, error: message });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<Response | void> {
    const { username, birthDate } = req.body;

    if (!username || !birthDate) {
      return res.status(400).json({ success: false, message: 'Nome de usuário e data de nascimento são obrigatórios.' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { username } });

      if (!user || !user.birth_date) {
        return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
      }

      const userBirthDate = new Date(user.birth_date);
      const providedBirthDate = new Date(birthDate);

      if (userBirthDate.toISOString().slice(0, 10) !== providedBirthDate.toISOString().slice(0, 10)) {
        return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
      }

      return res.status(200).json({ success: true, message: 'Se o usuário existir e os dados estiverem corretos, um email de redefinição será enviado.' });
    } catch (error) {
      console.error('Erro no processo de esqueci a senha:', error);
      return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
  }
}
