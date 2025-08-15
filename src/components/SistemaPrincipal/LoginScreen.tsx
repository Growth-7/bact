import React, { useState } from 'react';
import { Briefcase, ArrowRight, ArrowLeft } from 'lucide-react';
import Layout from '../Layout';
import { User } from '../../types';

interface LoginScreenProps {
  onLogin: (token: string) => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  onBack: () => void;
}

export default function LoginScreen({ onLogin, onSwitchToRegister, onSwitchToForgotPassword, onBack }: LoginScreenProps) {
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
        onLogin(data.token);
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
      <div className="relative flex items-center justify-center min-h-[calc(100vh-200px)] p-8">
        <div className="absolute bottom-8 left-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-lg p-2 text-slate-600 font-medium transition-colors hover:bg-slate-100 hover:text-slate-900"
            title="Voltar"
          >
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </button>
        </div>

        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-10 animate-slideIn">
            <div className="text-center mb-8">
              <div className="bg-blue-100 p-4 rounded-2xl inline-block mb-4">
                <Briefcase className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-3xl font-light text-slate-900 mb-3">Acesso ao Sistema Principal</h3>
              <p className="text-slate-500">Entre com suas credenciais para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                  Nome do Usuário
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Seu nome de usuário"
                  required
                />
              </div>
              <div>
                <label htmlFor="password"  className="block text-sm font-medium text-slate-700 mb-2">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Sua senha"
                  required
                />
              </div>

              {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-center">{error}</div>}

              <div className="flex items-center justify-between text-sm">
                <a onClick={onSwitchToForgotPassword} className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
                  Esqueceu sua senha?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-4 rounded-xl flex justify-center items-center gap-2 transition-all duration-200"
              >
                {isLoading ? 'Entrando...' : <><span>Entrar</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="text-center mt-6 text-sm">
              <p className="text-slate-500">
                Não tem uma conta?{' '}
                <a onClick={onSwitchToRegister} className="font-semibold text-blue-600 hover:text-blue-500 cursor-pointer">
                  Cadastre-se
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
