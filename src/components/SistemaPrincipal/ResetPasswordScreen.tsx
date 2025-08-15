import React, { useState } from 'react';
import Layout from '../Layout';
import { Lock, ArrowRight } from 'lucide-react';

interface ResetPasswordScreenProps {
  username: string;
  birthDate: string;
  onSuccess: () => void;
  onBack: () => void;
}

export default function ResetPasswordScreen({ username, birthDate, onSuccess, onBack }: ResetPasswordScreenProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, birthDate, newPassword }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || 'Não foi possível redefinir a senha.');
        return;
      }
      onSuccess();
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
            <p className="text-slate-500">Informe nova senha</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            {error && <div className="text-red-600 bg-red-100 p-3 rounded-lg">{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white p-3 rounded-lg flex justify-center items-center gap-2"
            >
              {isLoading ? 'Redefinindo...' : (
                <>
                  <span>Redefinir Senha</span>
                  <ArrowRight />
                </>
              )}
            </button>

            <div className="text-center">
              <button type="button" onClick={onBack} className="text-sm text-blue-600 hover:underline">
                Voltar
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}


