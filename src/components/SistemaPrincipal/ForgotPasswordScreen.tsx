import React, { useState } from 'react';
import { User as UserIcon, Calendar, ArrowRight, Lock } from 'lucide-react';
import Layout from '../Layout';

interface ForgotPasswordScreenProps {
  onSwitchToLogin: () => void;
  onValidated: (payload: { username: string; birthDate: string }) => void;
}

export default function ForgotPasswordScreen({ onSwitchToLogin, onValidated }: ForgotPasswordScreenProps) {
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleValidate = async (e: React.FormEvent) => {
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

      const isOk = response.ok && data.success;
      if (!isOk) {
        setError(data.message || 'Falha ao processar a solicitação.');
        setIsValidated(false);
        return;
      }
      setIsValidated(true);
      setSuccessMessage('Dados validados. Defina sua nova senha.');
      onValidated({ username, birthDate });
    } catch (err) {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidated) {
      setError('Valide seus dados antes de redefinir a senha.');
      return;
    }
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Informe e confirme a nova senha.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, birthDate, newPassword }),
      });
      const data = await response.json();
      const isOk = response.ok && data.success;
      if (!isOk) {
        setError(data.message || 'Não foi possível redefinir a senha.');
        return;
      }
      setSuccessMessage('Senha redefinida com sucesso. Você já pode fazer login.');
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
          <form onSubmit={isValidated ? handleResetPassword : handleValidate} className="space-y-6">
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
                  disabled={isValidated}
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
                  disabled={isValidated}
                />
              </div>
            </div>
            {isValidated && (
              <>
                <div>
                  <label htmlFor="newPassword">Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 p-3 border rounded-lg"
                      placeholder="Defina sua nova senha"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 p-3 border rounded-lg"
                      placeholder="Repita a nova senha"
                      required
                    />
                  </div>
                </div>
              </>
            )}
            {error && <div className="text-red-600 bg-red-100 p-3 rounded-lg">{error}</div>}
            {successMessage && <div className="text-green-600 bg-green-100 p-3 rounded-lg">{successMessage}</div>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white p-3 rounded-lg flex justify-center items-center gap-2"
            >
              {isLoading
                ? (isValidated ? 'Redefinindo...' : 'Verificando...')
                : (
                  <>
                    <span>{isValidated ? 'Redefinir Senha' : 'Verificar'}</span>
                    <ArrowRight />
                  </>
                )}
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
