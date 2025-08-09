import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import UserProfile from './UserProfile';
import { getUserSummary } from '../services/user';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const [summary, setSummary] = useState<any | null>(null);
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  useEffect(() => {
    // tentar extrair userId do token localStorage, se existir
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      const userId = payload?.id;
      const username = payload?.username || payload?.sub || 'Usuário';
      if (userId) {
        setUser({ id: userId, username });
        getUserSummary(userId).then((s) => s && setSummary(s)).catch(() => {});
      }
    } catch {}
  }, []);

  // Prevenir navegação para trás (F5/refresh continua na mesma tela; back do browser não volta automaticamente)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Não impedir o unload, apenas manter o estado por localStorage já presente
      // Mas evitamos dependências aqui.
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">BACT</h1>
                <p className="text-xs text-slate-500">Base de Arquivos para Certidões e Tradução</p>
              </div>
            </div>
            {user && (
              <UserProfile
                user={user}
                stats={
                  summary || {
                    totalSubmissions: 0,
                    todayCount: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    dailyGoal: 336,
                    weeklyData: [],
                    totalUsers: 0,
                    rank: 0,
                  }
                }
              />
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-[70%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {title && (
          <div className="mb-8">
            <h2 className="text-2xl font-light text-slate-900">{title}</h2>
            <div className="mt-2 h-px bg-gradient-to-r from-blue-600 to-transparent w-24"></div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}