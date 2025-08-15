import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Layout from '../Layout';
import { ArrowLeft, LogOut, ShieldCheck, Users, BarChart2 } from 'lucide-react';
import { User } from '../../types';
import StatisticsDashboard from './StatisticsDashboard';

interface AdminDashboardProps {
  onNavigateToMain: () => void;
  onLogout: () => void;
}

type Tab = 'pending' | 'all' | 'dashboard';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToMain, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loggedInAdminId = useMemo(() => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      return payload?.id;
    } catch {
      return null;
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token não encontrado. Faça o login novamente.');
      }
      
      const [pendingRes, allRes] = await Promise.all([
        axios.get('/api/auth/users/pending', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/auth/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (pendingRes.data.success) {
        setPendingUsers(pendingRes.data.users);
      } else {
        throw new Error(pendingRes.data.message || 'Falha ao buscar usuários pendentes.');
      }

      if (allRes.data.success) {
        setAllUsers(allRes.data.users);
      } else {
        throw new Error(allRes.data.message || 'Falha ao buscar todos os usuários.');
      }

    } catch (err: any) {
      console.error("Erro detalhado ao buscar dados do admin:", err.response);
      setError(err.response?.data?.message || 'Ocorreu um erro de rede.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (userId: string, status: 'ACTIVE' | 'REJECTED' | 'INACTIVE') => {
    try {
        const token = localStorage.getItem('authToken');
        await axios.put(`/api/auth/users/${userId}/status`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData(); // Recarrega todos os dados
    } catch (err: any) {
      console.error("Erro detalhado ao atualizar status:", err.response);
      setError(err.response?.data?.message || 'Falha ao atualizar o status do usuário.');
    }
  };
  
  const TabButton = ({ tab, label, icon: Icon }: { tab: Tab; label: string; icon: React.ElementType }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeTab === tab
          ? 'bg-blue-600 text-white'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );

  return (
    <Layout title="Painel do Administrador">
      <div className="flex justify-between items-center mb-6">
        {/* Abas */}
        <div className="flex items-center space-x-2 border border-slate-200 rounded-lg p-1">
          <TabButton tab="dashboard" label="Dashboard" icon={BarChart2} />
          <TabButton tab="pending" label={`Aprovações (${pendingUsers.length})`} icon={ShieldCheck} />
          <TabButton tab="all" label="Usuários" icon={Users} />
        </div>
        {/* Navegação */}
        <div className="flex items-center space-x-4">
            <button
              onClick={onNavigateToMain}
              className="flex items-center gap-2 rounded-lg p-2 text-slate-600 font-medium transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft size={20} />
              <span>Sistema Principal</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 rounded-lg p-2 text-red-500 font-medium transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
        </div>
      </div>
      
      {loading && <div className="text-center p-8 text-slate-500">Carregando dados...</div>}
      
      {error && <div className="text-center p-8 text-red-500 bg-red-50 rounded-lg">Erro: {error}</div>}
      
      {!loading && !error && (
        <>
        {activeTab === 'dashboard' && <StatisticsDashboard />}
        
        <div className={`bg-white border border-slate-200 rounded-xl shadow-sm ${activeTab === 'dashboard' ? 'hidden' : ''}`}>
          {activeTab === 'pending' && (
             pendingUsers.length === 0 ? (
                <div className="text-center p-12"><p className="text-slate-500">Nenhum usuário aguardando aprovação.</p></div>
             ) : (
                <ul className="divide-y divide-slate-200">
                  {pendingUsers.map((user) => (
                    <li key={user.id} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-800">{user.username}</p>
                        <p className="text-sm text-slate-500">
                          Registrado em: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-x-2">
                        <button
                          onClick={() => handleUpdateStatus(user.id, 'ACTIVE')}
                          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg transition-colors"
                          title="Aprovar Usuário"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(user.id, 'REJECTED')}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg transition-colors"
                          title="Rejeitar Usuário"
                        >
                          Rejeitar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
             )
          )}
          {activeTab === 'all' && (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Usuário</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Data de Registro</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {allUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.user_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        user.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                        user.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleUpdateStatus(user.id, user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                        disabled={user.id === loggedInAdminId}
                        className={`px-3 py-1 rounded-md text-white text-xs font-semibold transition-colors
                          ${user.id === loggedInAdminId
                            ? 'bg-slate-300 cursor-not-allowed'
                            : user.status === 'ACTIVE'
                              ? 'bg-yellow-500 hover:bg-yellow-600'
                              : 'bg-green-500 hover:bg-green-600'
                          }`}
                      >
                        {user.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        </>
      )}
    </Layout>
  );
};

export default AdminDashboard;
