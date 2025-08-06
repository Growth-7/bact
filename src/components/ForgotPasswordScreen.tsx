import React, { useState } from 'react';
import { User as UserIcon, Calendar, ArrowRight } from 'lucide-react';
import Layout from './Layout';

interface ForgotPasswordScreenProps {
  onSwitchToLogin: () => void;
}

export default function ForgotPasswordScreen({ onSwitchToLogin }: ForgotPasswordScreenProps) {
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !birthDate.trim()) {
        setError('Todos os campos são obrigatórios.');
        return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, birthDate }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage(data.message || 'Solicitação de redefinição de senha enviada com sucesso!');
      } else {
        setError(data.message || 'Falha ao processar a solicitação.');
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
            <h3 className="text-2xl font-light">Recuperar Senha</h3>
            <p className="text-slate-500">Informe seus dados para continuar</p>
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
              <label htmlFor="birthDate">Data de Nascimento</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full pl-10 p-3 border rounded-lg"
                  required
                />
              </div>
            </div>
            {error && <div className="text-red-600 bg-red-100 p-3 rounded-lg">{error}</div>}
            {successMessage && <div className="text-green-600 bg-green-100 p-3 rounded-lg">{successMessage}</div>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white p-3 rounded-lg flex justify-center items-center gap-2"
            >
              {isLoading ? 'Verificando...' : <><span>Recuperar</span><ArrowRight /></>}
            </button>
            <div className="text-center">
              <button type="button" onClick={onSwitchToLogin} className="text-sm text-blue-600 hover:underline">
                Lembrou a senha? Faça login
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
