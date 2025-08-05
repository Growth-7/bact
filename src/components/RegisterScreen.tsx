import React, { useState } from 'react';
import { User, Lock, ArrowRight, Hash } from 'lucide-react';
import Layout from './Layout';

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterScreen({ onRegisterSuccess, onSwitchToLogin }: RegisterScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userIdBitrix24, setUserIdBitrix24] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !userIdBitrix24.trim()) {
        setError('Todos os campos são obrigatórios.');
        return;
    };
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('http://localhost:3333/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, user_id_bitrix24: userIdBitrix24 }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('Usuário cadastrado com sucesso! Você será redirecionado para o login.');
        setTimeout(() => {
            onRegisterSuccess();
        }, 2000);
      } else {
        setError(data.message || 'Falha no cadastro.');
      }
    } catch (err) {
      setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-light text-slate-900 mb-2">Criar Nova Conta</h3>
              <p className="text-slate-500 text-sm">Preencha os campos para se cadastrar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                  Nome do Usuário
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-400"
                    placeholder="Digite seu nome de usuário"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-400"
                    placeholder="Digite sua senha"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="userIdBitrix24" className="block text-sm font-medium text-slate-700 mb-2">
                  ID do Usuário Bitrix24
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="userIdBitrix24"
                    type="text"
                    value={userIdBitrix24}
                    onChange={(e) => setUserIdBitrix24(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-400"
                    placeholder="Digite o seu ID do Bitrix24"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative" role="alert">
                  <span className="block sm:inline">{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Cadastrar</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-sm text-blue-600 hover:underline"
                >
                    Já tem uma conta? Faça login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
