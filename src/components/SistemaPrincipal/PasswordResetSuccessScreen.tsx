import React from 'react';
import Layout from '../Layout';

interface PasswordResetSuccessScreenProps {
  onGoToLogin: () => void;
}

export default function PasswordResetSuccessScreen({ onGoToLogin }: PasswordResetSuccessScreenProps) {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl text-center">
          <h3 className="text-2xl font-light">Senha redefinida com sucesso!</h3>
          <p className="text-slate-500">Você já pode fazer login com sua nova senha.</p>
          <button
            onClick={onGoToLogin}
            className="w-full bg-blue-600 text-white p-3 rounded-lg"
          >
            Ir para o Login
          </button>
        </div>
      </div>
    </Layout>
  );
}


