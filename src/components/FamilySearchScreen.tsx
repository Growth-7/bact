import React, { useEffect, useState } from 'react';
import { Search, Users, ArrowRight, ArrowLeft, Loader2, Image as ImageIcon } from 'lucide-react';
import Layout from './Layout';
import { Family } from '../types';

interface FamilySearchScreenProps {
  onFamilySelect: (family: Family) => void;
  onBack: () => void;
}

export default function FamilySearchScreen({ onFamilySelect, onBack }: FamilySearchScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Family[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [myFamilies, setMyFamilies] = useState<Array<{ id: string; name: string; lastAt?: string; total?: number }>>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    // Carregar famílias já enviadas pelo usuário logado
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      const userId = payload?.id;
      if (!userId) return;
      const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
      fetch(`${apiUrl}/api/submissions/user/${userId}/families`)
        .then(r => r.json())
        .then(d => setMyFamilies(d.success ? (d.data || []) : []))
        .catch(() => {});
    } catch {}
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
      const url = `${apiUrl}/api/auth/families/search?q=${encodeURIComponent(searchTerm)}`;
      const response = await fetch(url, { method: 'GET' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      const familiesRaw: Family[] = (data.families || []).map((item: any) => {
        const rawId: string = item.familiaId || item.id || '';
        return {
          id: rawId.toUpperCase(),
          name: item.familiaName || 'Sem nome',
          members: [],
          documentsCount: 0,
        } as Family;
      });
      const uniqueById = Array.from(
        new Map<string, Family>(familiesRaw.map((f) => [f.id.toLowerCase(), f])).values()
      );
      setSearchResults(uniqueById);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Layout title="Buscar Família">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 fade-in">
        <div className="mb-8">
          <p className="text-slate-600 mb-6">
            Digite o ID da família ou nome da família para buscar no sistema.
          </p>
          
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-400 text-lg"
                placeholder="Digite o ID ou nome da família"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchTerm.trim()}
              title="Buscar família no sistema"
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 flex items-center space-x-2 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Buscar</span>
            </button>
          </div>
        </div>

        {hasSearched && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">
              Resultados da Busca ({searchResults.length})
            </h3>
            
            {searchResults.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl animate-fadeIn">
                <Users className="w-16 h-16 text-slate-400 mx-auto mb-6" />
                <p className="text-slate-600 text-lg mb-2">Nenhuma família encontrada</p>
                <p className="text-sm text-slate-500 mt-2">
                  Verifique se o ID ou nome está correto
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {searchResults.map((family, index) => (
                  <div
                    key={family.id}
                    onClick={() => onFamilySelect(family)}
                    title={`Selecionar família ${family.name}`}
                    className="border border-slate-200 rounded-2xl p-8 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-lg transform hover:scale-[1.02] animate-slideIn"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6 flex-1">
                        <div className="bg-blue-100 p-4 rounded-2xl group-hover:bg-blue-200 transition-colors duration-200">
                          <Users className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-3">
                            <h4 className="text-xl font-bold text-slate-900 group-hover:text-blue-900 transition-colors duration-200">
                              Família {family.name}
                            </h4>
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">
                              {family.id}
                            </span>
                          </div>
                          <div className="text-slate-600 mb-2 text-lg">
                            <strong>Membros:</strong> {family.members.join(', ')}
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                              {family.members.length} {family.members.length === 1 ? 'membro' : 'membros'}
                            </span>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                              {family.documentsCount} {family.documentsCount === 1 ? 'doc' : 'docs'}
                            </span> 
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-2 transition-all duration-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Seção de famílias já enviadas pelo usuário */}
        {myFamilies.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" /> Minhas Famílias
                <span className="ml-2 text-sm text-slate-500 font-normal">{myFamilies.length}</span>
              </h3>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filtrar..."
                  className="pl-8 pr-3 py-1.5 border rounded-md text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myFamilies
                .filter(f => !filter.trim() || f.name.toLowerCase().includes(filter.toLowerCase()) || f.id.toLowerCase().includes(filter.toLowerCase()))
                .map((f) => (
                <button
                  key={f.id}
                  onClick={() => onFamilySelect({ id: f.id, name: f.name, members: [], documentsCount: 0 })}
                  className="text-left border border-slate-200 rounded-xl p-4 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                  title={`Abrir família ${f.name}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 rounded-lg p-2">
                      <Users className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">{f.name}</div>
                      <div className="text-xs text-slate-500 truncate">ID: {f.id} • {f.total || 0} docs</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-8 border-t border-slate-200">
          <button
            type="button"
            onClick={onBack}
            title="Voltar para tela de login"
            className="flex items-center space-x-2 px-6 py-3 text-slate-600 hover:text-slate-800 transition-all duration-200 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
        </div>
      </div>
    </Layout>
  );
}