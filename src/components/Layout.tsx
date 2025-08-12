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
    const day = now.getDay(); // 0=Dom,1=Seg,...,5=Sex
    
    const greetings = ['Bom dia', 'Como vai', 'Vamos lá', 'E aí'];
    const base = greetings[Math.floor(Math.random() * greetings.length)];

    const variations = {
      default: [
        'Mais um dia, mais uma oportunidade de procrastinar.',
        'Vamos ver no que dá hoje...',
        'O café está forte, as expectativas nem tanto.',
        'Consistência: fazer a mesma coisa esperando resultados diferentes.',
        'Sua dedicação está... bem, está aí.',
        'Encerrando mais um episódio da série "vida corporativa".',
        'Bem-vindo a mais um dia de "vamos fingir que sabemos o que estamos fazendo".',
        'Que a força da internet estável esteja com você.',
        'Hoje é o dia! (ou pelo menos é o que dizem).',
        'Produtividade: conceito abstrato desde 2020.',
        'Mais um round na luta épica contra os prazos.',
        'Começando o dia com otimismo... vamos ver quanto tempo dura.',
      ],
      ahead: [
        'Olha só, você está realmente trabalhando hoje!',
        'Velocidade surpreendente para uma segunda-feira.',
        'Impressionante! Até eu não esperava por isso.',
        'Uau, alguém tomou o café turbo hoje.',
        'Que energia! Será que você dormiu direito?',
        'Ritmo de quem quer impressionar (ou terminar logo).',
        'Performance de final de ano chegando cedo.',
        'Modo "prazo para ontem" ativado.',
      ],
      onTrack: [
        'Ritmo normal de quem conhece o próprio limite.',
        'No caminho certo... pelo menos por enquanto.',
        'Foco razoável para os padrões atuais.',
        'Velocidade de cruzeiro ativada.',
        'Nem rápido, nem devagar: no ponto ideal.',
        'Seguindo firme no "nem tanto ao mar, nem tanto à terra".',
        'Produtividade dentro da normalidade (seja lá o que isso significa).',
        'Equilibrando trabalho e sanidade mental.',
      ],
      behind: [
        'Hora de fingir que o café resolve tudo.',
        'Calma, nem todo mundo pode ser produtivo.',
        'Relaxa, amanhã é outro dia (teoricamente).',
        'Lento e constante... bem, pelo menos lento.',
        'Talvez seja hora de verificar se o Wi-Fi está funcionando.',
        'Respirar fundo e aceitar que hoje não é o seu dia.',
        'Velocidade de segunda-feira pós-feriado.',
        'Modo "ainda estou acordando" permanentemente ativado.',
      ],
      farBehind: [
        'Respirar fundo e aceitar a realidade.',
        'Que a procrastinação esteja com você.',
        'Lembre-se: nem todo dia é dia.',
        'Hora de negociar com o cronograma.',
        'Talvez seja momento de redefinir "sucesso".',
        'Calma, até o Flash teve dias ruins.',
        'Estratégia nova: fingir que estava planejando assim.',
        'Lembre-se: tartaruga ganhou da lebre (eventualmente).',
        'Hoje é dia de ser gentil consigo mesmo.',
      ],
      firstPlace: [
        'Primeiro lugar! Alguém tinha que ser.',
        'Topo do ranking! (de hoje, pelo menos)',
        'Parabéns, você venceu... por enquanto.',
        'Líder do dia! O troféu imaginário é seu.',
        'Primeiro lugar! Agora pode relaxar (ou não).',
        'Topo! Aproveite a vista lá de cima.',
        'Campeão! Mas lembre-se: é só terça-feira.',
        'Primeiro lugar conquistado! Próximo desafio: manter.',
      ]
    };

    type PacingStatusKey = keyof typeof variations;

    const pacingStatus = summary?.pacingStatus as PacingStatusKey;
    const rank = summary?.rank;

    let tail = '';
    if (rank === 1) {
      tail = variations.firstPlace[Math.floor(Math.random() * variations.firstPlace.length)];
    } else if (pacingStatus) {
      const phraseList = variations[pacingStatus] || variations.default;
      tail = phraseList[Math.floor(Math.random() * phraseList.length)];
    } else {
      tail = variations.default[Math.floor(Math.random() * variations.default.length)];
    }

    let extra = '';
    if (day === 1) extra = ' Uma ótima semana para nós!';
    if (day === 5) extra = ' Sextou com S de sucesso!';
    if (rank && rank > 1) extra += ` Bora buscar o 1º lugar!`;

    return `${base}, ${user.username}! ${tail}${extra}`;
  }, [user, now, summary]);
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
    const handleBeforeUnload = (_e: BeforeUnloadEvent) => {
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