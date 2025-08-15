import React from 'react';
import { Briefcase, Eye } from 'lucide-react';
import Layout from '../Layout';
import { Screen } from '../../types';

interface WelcomeScreenProps {
  onNavigate: (screen: Screen) => void;
}

export default function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-800 mb-4">Bem-vindo(a)</h1>
          <p className="text-xl text-slate-600">Escolha como deseja acessar o sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
          {/* Opção Sistema Principal */}
          <div 
            className="bg-white rounded-2xl shadow-xl border border-slate-200 p-10 text-center cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105"
            onClick={() => onNavigate('login')}
          >
            <div className="bg-blue-100 p-5 rounded-full inline-block mb-6">
              <Briefcase className="w-16 h-16 text-blue-600" />
            </div>
            <h3 className="text-3xl font-semibold text-slate-900 mb-3">Sistema Principal</h3>
            <p className="text-slate-500">Acesso para gerenciamento completo, uploads e administração.</p>
          </div>

          {/* Opção Sistema de Consulta */}
          <div 
            className="bg-white rounded-2xl shadow-xl border border-slate-200 p-10 text-center cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105"
            onClick={() => onNavigate('consultaLogin' as Screen)} // Adicionar rota depois
          >
            <div className="bg-green-100 p-5 rounded-full inline-block mb-6">
              <Eye className="w-16 h-16 text-green-600" />
            </div>
            <h3 className="text-3xl font-semibold text-slate-900 mb-3">Sistema de Consulta</h3>
            <p className="text-slate-500">Acesso para visualização e busca de documentos.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
