import React, { useState } from 'react';
import { User as UserIcon, Lock, ArrowRight } from 'lucide-react';
import Layout from './Layout';
import { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onSwitchToRegister: () => void;
}

export default function LoginScreen({ onLogin, onSwitchToRegister }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLogin(data.user);
      } else {
        setError(data.message || 'Falha na autenticação.');
      }
    } catch (err) {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl">
          <div className="text-center">
            <h3 className="text-2xl font-light">Acesso ao Sistema</h3>
            <p className="text-slate-500">Entre com suas credenciais</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username">Nome do Usuário</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 p-3 border rounded-lg"
                  placeholder="Seu nome de usuário"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="password">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 p-3 border rounded-lg"
                  placeholder="Sua senha"
                  required
                />
              </div>
            </div>
            {error && <div className="text-red-600 bg-red-100 p-3 rounded-lg">{error}</div>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white p-3 rounded-lg flex justify-center items-center gap-2"
            >
              {isLoading ? 'Entrando...' : <><span>Entrar</span><ArrowRight /></>}
            </button>
            <div className="text-center">
              <button type="button" onClick={onSwitchToRegister} className="text-sm text-blue-600 hover:underline">
                Não tem uma conta? Cadastre-se
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
