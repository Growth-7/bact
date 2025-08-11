import React, { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import UserProfile from './UserProfile';
import { getUserSummary } from '../services/user';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showGreeting?: boolean;
}

export default function Layout({ children, title, showGreeting = false }: LayoutProps) {
  const [summary, setSummary] = useState<any | null>(null);
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const greeting = useMemo(() => {
    if (!user) return '';
    const hour = now.getHours();
    const day = now.getDay(); // 0=Dom,1=Seg,...,5=Sex
    const base = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const variationsMorning = [
      'vamos começar com o pé direito',
      'energia alta e foco na execução',
      'agenda clara, entregas com qualidade',
      'ritmo leve e consistente'
    ];
    const variationsAfternoon = [
      'seguimos entregando com ritmo',
      'meio do dia, foco total nas prioridades',
      'qualidade + velocidade, do jeito certo',
      'vamos acelerar com estratégia'
    ];
    const variationsEvening = [
      'fechando o dia com chave de ouro',
      'reta final — consistência vence',
      'ótimo ritmo hoje, parabéns',
      'últimos ajustes e partiu descanso'
    ];
    const pick = (arr: string[]) => arr[Math.floor(((now.getHours()*3600+now.getMinutes()*60+now.getSeconds())%arr.length))];
    const tail = hour < 12 ? pick(variationsMorning) : hour < 18 ? pick(variationsAfternoon) : pick(variationsEvening);
    let extra = '';
    if (day === 1) extra = ' • vamos abrir a semana bonito';
    if (day === 5) extra = ' • sextou com S de sucesso';
    return `${base}, ${user.username} • ${tail}!${extra}`;
  }, [user, now]);
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

      {user && showGreeting && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col items-center gap-3 fade-in text-center">
              <FileText className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-800">{greeting}</h2>
            </div>
          </div>
        </div>
      )}
      
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