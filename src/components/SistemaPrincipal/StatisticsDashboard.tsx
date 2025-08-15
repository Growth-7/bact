import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Award, Clock, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
    <div className="p-3 bg-blue-100 rounded-lg">
      <Icon className="w-6 h-6 text-blue-600" />
    </div>
    <div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

const StatisticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error("Token não encontrado");

        const response = await axios.get('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setStats(response.data.data);
        } else {
          throw new Error(response.data.message || 'Falha ao buscar estatísticas');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="text-center p-8">Carregando estatísticas...</div>;
  if (error) return <div className="text-center p-8 text-red-500 bg-red-50 rounded-lg">Erro: {error}</div>;
  if (!stats) return <div className="text-center p-8">Nenhuma estatística encontrada.</div>;

  return (
    <div className="space-y-8">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total de Envios" value={stats.ranking.reduce((acc: number, user: any) => acc + user.submissionCount, 0)} icon={TrendingUp} />
        <StatCard title="Usuário Mais Ativo" value={stats.ranking[0]?.username || 'N/A'} icon={Award} />
        <StatCard title="Atividade Recente" value={stats.recentActivity.length > 0 ? new Date(stats.recentActivity[0].lastActivity).toLocaleDateString() : 'N/A'} icon={Clock} />
      </div>

      {/* Gráfico de Envios */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Envios nos Últimos 7 Dias</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.submissionsLast7Days}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="Envios" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ranking de Usuários */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Ranking de Usuários</h3>
          <ul className="space-y-4">
            {stats.ranking.map((user: any, index: number) => (
              <li key={user.userId} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-bold text-slate-500">{index + 1}.</span>
                  <span>{user.username}</span>
                </div>
                <span className="font-bold text-slate-800">{user.submissionCount} envios</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Atividade Recente */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Atividade Recente</h3>
           <ul className="space-y-4">
            {stats.recentActivity.map((activity: any) => (
              <li key={activity.userId} className="flex items-center justify-between text-sm">
                <span>{activity.username}</span>
                <span className="text-slate-500">{new Date(activity.lastActivity).toLocaleString('pt-BR')}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;
