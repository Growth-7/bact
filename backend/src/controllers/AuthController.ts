import { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/DatabaseConnection.js';
import { v4 as uuidv4, validate as isUUID } from 'uuid';
import axios from 'axios';

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

const getFamilyCacheApiHeaders = () => {
  const API_KEY = process.env.FAMILY_CACHE_SUPABASE_ANON_KEY;
  const SERVICE_KEY = process.env.FAMILY_CACHE_SUPABASE_SERVICE_ROLE_KEY;
  if (!API_KEY || !SERVICE_KEY) {
    throw new Error('A configuração da API do family_cache está incompleta no servidor.');
  }
  return {
    'apikey': API_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
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
          birth_date: new Date(birth_date) 
        } 
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
          user_id_bitrix24: user.user_id_bitrix24 
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
      const API_URL = (process.env.VALIDATION_SUPABASE_URL || '').replace(/\/+$/, '');
      const REST_URL = API_URL.endsWith('/rest/v1') ? API_URL : `${API_URL}/rest/v1`;
      const { data } = await axios.get(
        `${REST_URL}/customer_full_info?select=*&familia_id=eq.${familyId}`,
        { headers }
      );

      if (!data || data.length === 0) {
        return res.status(404).json({ success: false, message: 'Nenhum membro encontrado para esta família.' });
      }

      const familyName = data[0]?.family_name || '';
      
      const members = data.map((member: any) => ({
        id: member.customer_id,
        name: member.full_name || member.slug || 'Nome não encontrado',
        customer_type: member.customer_type,
      }));

      return res.status(200).json({ success: true, members, familyName });
    } catch (error) {
      console.error('Erro ao buscar membros da família:', error);
      return res.status(500).json({ success: false, message: 'Erro ao buscar membros da família.' });
    }
  }

  async searchFamilies(req: Request, res: Response): Promise<Response | void> {
    const { q } = req.query as { q?: string };
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Parâmetro de busca (q) é obrigatório.' });
    }
    try {
      const like = `%${q}%`;
      // 1) Tenta camelCase com identificadores entre aspas (base atual)
      try {
        const rows = await prisma.$queryRaw<any[]>`
          SELECT id, "bitrixId", "requerenteId", "familiaId", "familiaName"
          FROM "family_cache"
          WHERE "familiaName" ILIKE ${like}
             OR "familiaId" ILIKE ${like}
             OR "bitrixId" ILIKE ${like}
             OR "requerenteId" ILIKE ${like}
          LIMIT 50
        `;
        const families = rows.map((r) => ({
          id: r.id,
          bitrixId: r.bitrixId ?? null,
          requerenteId: r.requerenteId ?? null,
          familiaId: r.familiaId ?? null,
          familiaName: r.familiaName ?? null,
        }));
        return res.status(200).json({ success: true, families });
      } catch (camelErr) {
        // 2) Fallback: snake_case (ambientes que usem underscores)
        const rows = await prisma.$queryRaw<any[]>`
          SELECT id, bitrix_id, requerente_id, familia_id, familia_name
          FROM "family_cache"
          WHERE familia_name ILIKE ${like}
             OR familia_id ILIKE ${like}
             OR bitrix_id ILIKE ${like}
             OR requerente_id ILIKE ${like}
          LIMIT 50
        `;
        const families = rows.map((r) => ({
          id: r.id,
          bitrixId: r.bitrix_id ?? null,
          requerenteId: r.requerente_id ?? null,
          familiaId: r.familia_id ?? null,
          familiaName: r.familia_name ?? null,
        }));
        return res.status(200).json({ success: true, families });
      }
    } catch (error: any) {
      console.error('Erro ao buscar famílias (DATABASE_URL):', error);
      return res.status(500).json({ success: false, message: 'Erro ao buscar famílias no banco.' });
    }
  }

  async addRequerente(req: Request, res: Response): Promise<Response | void> {
    const { familyName, idFamilia, requerenteName } = req.body;

    if (!familyName || !idFamilia || !requerenteName) {
      return res.status(400).json({ success: false, message: 'Dados insuficientes para adicionar requerente.' });
    }
    
    if (!isUUID(idFamilia)) {
      return res.status(400).json({ success: false, message: 'Formato de ID da Família inválido.' });
    }

    try {
      const supabaseUrl = process.env.VALIDATION_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/addRequerente`;
      const headers = getValidationApiHeaders();

      const response = await axios.post(functionUrl, {
        nome: requerenteName,
        slug: requerenteName,
        familia_id: idFamilia,
        customer_type: 'req'
      }, { headers });

      if (response.data && response.data.id) {
        return res.status(201).json({ success: true, idRequerente: response.data.id });
      } else {
        // Se a função Supabase retornar 200 mas sem um ID, ou com uma resposta inesperada
        throw new Error(response.data.error || 'Falha ao criar novo requerente no Supabase.');
      }
    } catch (error: any) {
      console.error('Erro ao adicionar requerente:', error.response?.data || error.message);
      return res.status(500).json({ success: false, message: error.response?.data?.error || 'Erro interno ao adicionar requerente.' });
    }
  }

  async addFamily(req: Request, res: Response): Promise<Response | void> {
    const { nome_familia, observacao } = req.body;

    if (!nome_familia) {
      return res.status(400).json({ success: false, message: 'O nome da família é obrigatório.' });
    }

    try {
      const supabaseUrl = process.env.VALIDATION_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('VALIDATION_SUPABASE_URL não está configurada no servidor.');
      }
      // Corrige a URL base removendo o caminho da API REST se ele existir
      const baseUrl = supabaseUrl.replace('/rest/v1', '');
      const functionUrl = `${baseUrl}/functions/v1/addFamilia`;

      const headers = getValidationApiHeaders();

      const payload = {
        nome_familia: nome_familia,
        observacao: observacao || ''
      };

      const response = await axios.post(functionUrl, {
        data: [payload]
      }, { headers });
      
      // Se a chamada para a Supabase foi bem-sucedida, adicione ao cache local
      if (response.status === 200 && response.data?.data?.[0]) {
        this.addFamilyToCache(response.data.data[0]);
      }

      return res.status(response.status).json(response.data);

    } catch (error: any) {
      console.error('Erro detalhado ao adicionar família via Supabase:');
      if (error.response) {
        console.error('Data:', error.response.data);
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request:', error.request);
      } else {
        console.error('Error Message:', error.message);
      }
      console.error('Config:', error.config);

      const statusCode = error.response?.status || 500;
      const message = error.response?.data?.error || 'Erro interno ao contatar o serviço de famílias.';
      return res.status(statusCode).json({ success: false, message });
    }
  }

  private async addFamilyToCache(familyData: { id: string; nome_familia: string }): Promise<void> {
    try {
      console.log(`Adicionando ao cache a família: ${familyData.nome_familia} (ID: ${familyData.id})`);
      
      // DEBUG: Logar as chaves do objeto prisma para ver os modelos disponíveis
      console.log('Modelos disponíveis no Prisma Client:', Object.keys(prisma));

      await prisma.familyCache.create({
        data: {
          id: familyData.id,
          bitrixId: familyData.id, // Usando o ID da Supabase como fallback, pois é obrigatório
          familiaId: familyData.id, // O ID da família é o próprio ID do registro
          familiaName: familyData.nome_familia,
        }
      });
      console.log('Família adicionada ao cache com sucesso.');
    } catch (cacheError: any) {
      // Se a inserção no cache falhar, apenas logamos o erro mas não paramos o fluxo.
      // O usuário ainda recebe a resposta de sucesso da criação principal.
      console.error('Falha ao adicionar família ao cache:', cacheError.message);
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
        // Mensagem genérica para não revelar se o usuário existe
        return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
      }

      const userBirthDate = new Date(user.birth_date);
      const providedBirthDate = new Date(birthDate);

      // Compara apenas a data (ignora a parte do tempo)
      if (userBirthDate.toISOString().slice(0, 10) !== providedBirthDate.toISOString().slice(0, 10)) {
        return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
      }

      // Validação bem-sucedida: permitir redefinição imediata no frontend
      return res.status(200).json({ success: true, message: 'Dados validados. Você pode redefinir sua senha agora.' });

    } catch (error) {
      console.error('Erro no processo de esqueci a senha:', error);
      return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<Response | void> {
    const { username, birthDate, newPassword } = req.body;

    if (!username || !birthDate || !newPassword) {
      return res.status(400).json({ success: false, message: 'Nome de usuário, data de nascimento e nova senha são obrigatórios.' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { username } });

      if (!user || !user.birth_date) {
        return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
      }

      const userBirthDate = new Date(user.birth_date);
      const providedBirthDate = new Date(birthDate);

      const isSameDate = userBirthDate.toISOString().slice(0, 10) === providedBirthDate.toISOString().slice(0, 10);
      if (!isSameDate) {
        return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { username }, data: { password: hashedPassword } });

      return res.status(200).json({ success: true, message: 'Senha redefinida com sucesso.' });
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
  }
}

