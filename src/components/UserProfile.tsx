import React, { useEffect, useRef, useState } from 'react';
import { User, Trophy, Target, TrendingUp, Flame, Medal, FileText, Clock, X, Users } from 'lucide-react';
import { UserStats, RankingUser } from '../types';
import { getUserSummary } from '../services/user';
import confetti from 'canvas-confetti';

interface UserProfileProps {
  user: {
    id: string;
    username: string;
  };
  stats: UserStats;
}

export default function UserProfile({ user, stats }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<UserStats | null>(null);
  const [goal, setGoal] = useState<number>(stats?.dailyGoal || 10);

  useEffect(() => {
    (async () => {
      const s = await getUserSummary(user.id);
      if (s) {
        setSummary(s);
        setGoal(s.dailyGoal);
      }
    })();
  }, [user.id]);

  const currentUserRank = (summary || stats).rank;
  const rankDisplay = currentUserRank && currentUserRank > 0 ? `#${currentUserRank}` : 'N/A';
  const totalUsersDisplay = (summary || stats).totalUsers || 0;
  const topRank: RankingUser[] = (((summary as any)?.topRank) || []).map((u: any) => ({
    id: u.id,
    username: u.username,
    totalSubmissions: u.totalSubmissions,
    currentStreak: u.currentStreak,
    todayCount: u.todayCount,
    rank: u.rank,
  }));
  const around = (((summary as any)?.aroundRank || (stats as any)?.aroundRank) || []) as Array<any>;
  let usersAroundCurrent: RankingUser[] = around.map((u: any, idx: number) => ({
    id: u.id || `around-${idx}`,
    username: u.username,
    totalSubmissions: u.totalSubmissions,
    currentStreak: u.currentStreak,
    todayCount: u.todayCount,
    rank: u.rank,
    isCurrentUser: u.id === user.id,
  }));
  if (!usersAroundCurrent.some(u => u.isCurrentUser)) {
    usersAroundCurrent = [
      {
        id: user.id,
        username: user.username,
        totalSubmissions: (summary || stats).totalSubmissions,
        currentStreak: (summary || stats).currentStreak,
        todayCount: (summary || stats).todayCount,
        isCurrentUser: true,
        rank: currentUserRank,
      },
      ...usersAroundCurrent,
    ];
  }

  // Fechar painel quando clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-profile-container') && !target.closest('.user-profile-sidebar')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevenir scroll do body
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600 bg-purple-100';
    if (streak >= 14) return 'text-orange-600 bg-orange-100';
    if (streak >= 7) return 'text-red-600 bg-red-100';
    return 'text-blue-600 bg-blue-100';
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) return { color: 'bg-yellow-500', icon: '👑' };
    if (rank <= 10) return { color: 'bg-gray-400', icon: '🥈' };
    if (rank <= 50) return { color: 'bg-orange-500', icon: '🥉' };
    return { color: 'bg-blue-500', icon: '🏅' };
  };

  const effective = summary || stats;
  const progressPercentage = Math.min((effective.todayCount / goal) * 100, 100);

  const hasReachedGoal = effective.todayCount >= goal && goal > 0;
  const farFromGoal = effective.todayCount < Math.max(1, Math.floor(goal * 0.25));

  // Confete uma vez por dia/usuário
  const confettiFiredRef = useRef(false);
  useEffect(() => {
    if (!hasReachedGoal) return;
    const key = `confetti_${user.id}_${new Date().toISOString().slice(0,10)}`;
    if (confettiFiredRef.current) return;
    if (localStorage.getItem(key)) return;
    confettiFiredRef.current = true;
    localStorage.setItem(key, '1');
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => confetti({ particleCount: 80, spread: 90, angle: 60, origin: { x: 0 } }), 300);
    setTimeout(() => confetti({ particleCount: 80, spread: 90, angle: 120, origin: { x: 1 } }), 300);
  }, [hasReachedGoal, user.id]);

  // Simular dados do gráfico dos últimos 7 dias
  const last7Days = (effective.weeklyData || []).map((_: { date: string; count: number }, i: number) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const foundDayData = (effective.weeklyData || []).find((d: { date: string; count: number }) => 
      new Date(d.date).toDateString() === date.toDateString()
    );
    return {
      day: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
      count: foundDayData?.count || 0,
      date: new Date(foundDayData?.date || date),
      isToday: date.toDateString() === new Date().toDateString()
    };
  });

  const maxCount = Math.max(...last7Days.map((d: { count: number }) => d.count), 1);

  // Ranking sempre exibido por completo
  return (
    <>
      {/* Botão Compacto no Header */}
      <div className="user-profile-container">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all duration-200 hover:shadow-md group"
        >
          {/* Avatar com estados: dourado quando bateu meta; vermelho se longe da meta */}
          <div className="relative">
            <div
              className={
                hasReachedGoal
                  ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 p-2.5 rounded-full ring-2 ring-yellow-300 shadow-md group-hover:scale-105 transition-transform duration-200'
                  : farFromGoal
                    ? 'bg-gradient-to-br from-red-500 to-red-600 p-2.5 rounded-full ring-2 ring-red-300 shadow-md group-hover:scale-105 transition-transform duration-200'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-full group-hover:scale-105 transition-transform duration-200'
              }
            >
              <User className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Ofensiva ao lado do ícone */}
           {effective.currentStreak > 0 && (
            <div className={`px-3 py-1.5 rounded-full flex items-center space-x-2 ${getStreakColor(effective.currentStreak)} shadow-sm`}>
              <Flame className="w-4 h-4" />
              <span className="font-bold text-sm">{effective.currentStreak}</span>
            </div>
          )}

          {/* Info Rápida */}
            <div className="text-left flex-1">
            <div className="font-semibold text-slate-900 text-base">{user.username}</div>
            <div className="text-sm text-slate-600 flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <Trophy className="w-3 h-3" />
                <span>#{currentUserRank} de {effective.totalUsers}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Target className="w-3 h-3" />
                <span>{effective.todayCount}/{goal} hoje</span>
              </span>
            </div>
          </div>
          
          {/* Indicador de expansão */}
          <div className="text-slate-400 group-hover:text-slate-600 transition-colors duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-300" />
      )}

      {/* Painel Lateral */}
      <div className={`user-profile-sidebar fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header do Painel */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-full">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{user.username}</h3>
                <p className="text-blue-100 text-sm">
                  {(() => {
                    const h = new Date().getHours();
                    const base = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
                    const d = new Date().getDay();
                    const extra = d === 1 ? ' • Vamos começar a semana!' : d === 5 ? ' • Ótima sexta!' : '';
                    return `${base}, ${user.username}${extra}`;
                  })()}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo do Painel */}
        <div className="p-6 overflow-y-auto h-full pb-20">
          {/* Saudação grande */}
          <div className="mb-6">
            <div className="flex items-center gap-3 fade-in">
              <span className="text-rose-300">❋</span>
              <h3 className="text-2xl font-semibold tracking-tight">
                {(() => {
                  const h = new Date().getHours();
                  const base = h < 12 ? 'Como vai' : h < 18 ? 'Boa tarde' : 'Boa noite';
                  return `${base}, ${user.username}?`;
                })()}
              </h3>
            </div>
          </div>

          {/* Estatísticas Principais */}
          <div className="space-y-4 mb-6">
              {/* Ofensiva (cadência/hora) */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 flex items-center space-x-4 group">
              <div className="bg-red-50 p-3 rounded-lg flex-shrink-0 relative overflow-hidden">
                <Flame className="w-6 h-6 text-red-600 relative z-10" />
                {/* Animação de choque elétrico */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-200 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300"></div>
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <div className="flex-1 relative z-10">
                  {(() => {
                    const perHourTarget = Math.max(1, Math.floor((effective as any).perHourTarget || 0));
                    const cumulativeExpected = Math.max(0, (effective as any).cumulativeExpected || 0);
                    const cadenceStreakHours = Math.max(0, (effective as any).cadenceStreakHours || 0);
                    const pacingStatus = (effective as any).pacingStatus as string | undefined;
                    const statusLabel = pacingStatus === 'ahead' ? 'Adiantado'
                      : pacingStatus === 'onTrack' ? 'No ritmo'
                      : pacingStatus === 'behind' ? 'Atrasando'
                      : pacingStatus === 'farBehind' ? 'Bem atrás'
                      : '-';
                    return (
                      <>
                        <div className="flex items-baseline space-x-2 mb-1">
                          <div className="text-2xl font-bold text-slate-900">{cadenceStreakHours}h</div>
                          <div className="text-sm text-slate-700 font-medium">Ofensiva</div>
                        </div>
                        <div className="text-xs text-slate-500">
                          Meta/hora: {perHourTarget} • Esperado até agora: {cumulativeExpected} • Ritmo: {statusLabel}
                        </div>
                      </>
                    );
                  })()}
              </div>
            </div>

            {/* Ranking */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 flex items-center space-x-4 group">
              <div className="bg-yellow-50 p-3 rounded-lg flex-shrink-0 relative overflow-hidden">
                <Trophy className="w-6 h-6 text-yellow-600 relative z-10" />
                {/* Animação de choque elétrico */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300"></div>
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline space-x-2 mb-1">
                  <div className="text-2xl font-bold text-slate-900">{rankDisplay}</div>
                  <div className="text-sm text-slate-700 font-medium">Posição</div>
                </div>
                <div className="text-xs text-slate-500">
                  {currentUserRank > 0 ? (
                    <>
                      {getRankBadge(currentUserRank).icon} Continue assim!
                    </>
                  ) : (
                    'Faça envios para entrar no rank!'
                  )}
                </div>
              </div>
            </div>

            {/* Total de Envios */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 flex items-center space-x-4 group">
              <div className="bg-blue-50 p-3 rounded-lg flex-shrink-0 relative overflow-hidden">
                <FileText className="w-6 h-6 text-blue-600 relative z-10" />
                {/* Animação de choque elétrico */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300"></div>
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline space-x-2 mb-1">
                  <div className="text-2xl font-bold text-slate-900">{effective.totalSubmissions}</div>
                  <div className="text-sm text-slate-700 font-medium">Total</div>
                </div>
                <div className="text-xs text-slate-500">Documentos enviados</div>
              </div>
            </div>

            {/* Hoje */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 flex items-center space-x-4 group">
              <div className="bg-green-50 p-3 rounded-lg flex-shrink-0 relative overflow-hidden">
                <Clock className="w-6 h-6 text-green-600 relative z-10" />
                {/* Animação de choque elétrico */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-200 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300"></div>
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline space-x-2 mb-1">
                  <div className="text-2xl font-bold text-slate-900">{effective.todayCount}</div>
                  <div className="text-sm text-slate-700 font-medium">Hoje</div>
                </div>
                <div className="text-xs text-slate-500">Meta: {goal}</div>
              </div>
            </div>
          </div>

          {/* Meta Diária */}
          <div className="mb-5 bg-white rounded-lg p-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-slate-900">Meta Diária</span>
              </div>
              <span className="text-slate-600 text-sm">
                {effective.todayCount}/{goal} documentos
              </span>
            </div>
            
            <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`${hasReachedGoal ? 'bg-green-600' : farFromGoal ? 'bg-red-600' : 'bg-blue-600'} h-full rounded-full transition-all duration-500`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            {progressPercentage >= 100 && (
              <div className="text-center mt-2">
                <span className="text-green-600 font-medium text-sm">🎉 Meta alcançada!</span>
              </div>
            )}

            {/* Meta fixa: editor removido */}
          </div>

          {/* Ranking Detalhado (exibição completa) */}
          <div className="mb-5 bg-white rounded-lg p-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="bg-purple-50 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-medium text-slate-900">Ranking</span>
              </div>
              <div className="text-sm text-slate-600">
                {currentUserRank > 0 ? `${currentUserRank}º` : '-'} de {totalUsersDisplay}
              </div>
            </div>

            {/* Lista completa (top 3 + ao redor/geral) */}
            {topRank.length > 0 && (
              <div className="grid grid-cols-1 gap-2 mb-4">
                {topRank.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${u.rank === 1 ? 'bg-yellow-100 text-yellow-800' : u.rank === 2 ? 'bg-gray-200 text-gray-800' : 'bg-orange-100 text-orange-800'}`}>
                        {u.rank === 1 ? '1º' : u.rank === 2 ? '2º' : '3º'}
                      </div>
                      <div className="text-xs font-medium text-slate-900">{u.username}</div>
                    </div>
                    <div className="text-xs font-bold text-slate-700">{u.totalSubmissions}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 gap-2">
              {usersAroundCurrent.map((rankUser) => {
                const isCurrentUser = Boolean(rankUser.isCurrentUser);
                const rankNumber = typeof rankUser.rank === 'number' ? rankUser.rank : undefined;
                const rankBadgeClass =
                  rankNumber === 1
                    ? 'bg-yellow-100 text-yellow-800'
                    : rankNumber === 2
                    ? 'bg-gray-200 text-gray-800'
                    : rankNumber === 3
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-slate-100 text-slate-600';

                return (
                  <div
                    key={rankUser.id}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-200 ${
                      isCurrentUser ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rankBadgeClass}`}>
                        {rankNumber ? `${rankNumber}º` : '—'}
                      </div>
                      <div className={`text-xs font-medium ${isCurrentUser ? 'text-blue-900' : 'text-slate-900'}`}>
                        {rankUser.username} {isCurrentUser && '(Você)'}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-700">
                      {rankUser.totalSubmissions}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Famílias recentes do usuário */}
          {Array.isArray((effective as any).recentFamilies) && (effective as any).recentFamilies.length > 0 && (
            <div className="mb-5 bg-white rounded-lg p-4 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="bg-emerald-50 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-medium text-slate-900">Famílias Recentes</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {((effective as any).recentFamilies as Array<any>).map((f: any) => (
                  <a
                    key={f.id}
                    href={`/Documentos?familia=${encodeURIComponent(f.id)}`}
                    className="px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    title={`Abrir família ${f.name}`}
                  >
                    {f.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Gráfico da Semana */}
          <div className="mb-5 bg-white rounded-lg p-4 shadow-sm border border-slate-200">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-indigo-50 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="font-medium text-slate-900">Últimos 7 dias</span>
            </div>
            
            {/* Gráfico de Barras Real */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-end justify-between space-x-2 h-24">
              {last7Days.map((day, index) => (
                <div key={index} className="flex flex-col items-center flex-1 group">
                  <div className="flex-1 flex items-end mb-1 w-full">
                    <div 
                      className={`w-full rounded-t transition-all duration-300 ${
                        day.count > 0 
                          ? day.isToday
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                          : 'bg-slate-300'
                      }`}
                      style={{ 
                        height: `${Math.max((day.count / maxCount) * 80, day.count > 0 ? 8 : 3)}px`
                      }}
                    />
                  </div>
                  <div className="text-xs text-slate-600 font-semibold mb-2">{day.day}</div>
                  <div className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${
                    day.count > 0 
                      ? day.isToday
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>{day.count}</div>
                </div>
              ))}
              </div>
            </div>
          </div>

          {/* Conquistas */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-yellow-50 p-2 rounded-lg">
                <Medal className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="font-medium text-slate-900">Conquistas</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {stats.currentStreak >= 7 && (
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                  <span>🔥</span>
                  <span>Semana em Chamas</span>
                </div>
              )}
              
              {stats.totalSubmissions >= 50 && (
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                  <span>📚</span>
                  <span>Colecionador</span>
                </div>
              )}
              
              {currentUserRank <= 10 && (
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                  <span>👑</span>
                  <span>Top 10</span>
                </div>
              )}
              
              {progressPercentage >= 100 && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                  <span>🎯</span>
                  <span>Meta Diária</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}