import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { DatabaseConnection } from '../config/DatabaseConnection';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const { username, password, user_id_bitrix24 } = req.body;

    if (!username || !password || !user_id_bitrix24) {
      res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios: nome de usuário, senha e ID do Bitrix24.' });
      return;
    }

    try {
      const prisma = DatabaseConnection.getInstance();

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: username },
            { user_id_bitrix24: user_id_bitrix24 }
          ]
        }
      });

      if (existingUser) {
        res.status(409).json({ success: false, message: 'Nome de usuário ou ID do Bitrix24 já cadastrado.' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          user_id_bitrix24,
        },
      });

      res.status(201).json({ success: true, message: 'Usuário cadastrado com sucesso!', user: { id: user.id, username: user.username } });
    } catch (error) {
      console.error('Erro no cadastro:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Nome de usuário e senha são obrigatórios.' });
      return;
    }

    try {
      const prisma = DatabaseConnection.getInstance();
      const user = await prisma.user.findUnique({
        where: {
          username: username,
        },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({ success: false, message: 'Senha incorreta.' });
        return;
      }

      res.status(200).json({ success: true, user: { id: user.id, username: user.username, user_id_bitrix24: user.user_id_bitrix24 } });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
  }
}
