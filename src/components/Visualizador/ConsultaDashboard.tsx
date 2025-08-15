import React, { useState } from 'react';
import { Search, Eye } from 'lucide-react';
import Layout from '../Layout';
import { DocumentSubmission } from '../../types';

// Tipos simplificados para este componente
interface Document {
  id: string;
  documentType: string;
  fileUrls: string[];
  uploadDate: string;
}

interface Family {
  id: string;
  name: string;
  documents: Document[];
}

export default function ConsultaDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [family, setFamily] = useState<Family | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError(null);
    setFamily(null);

    const apiUrl = (import.meta as any).env?.VITE_API_URL || '';

    try {
      // 1. Buscar o ID da família pelo nome
      const searchRes = await fetch(`${apiUrl}/api/auth/families/search?q=${encodeURIComponent(searchTerm)}`);
      const searchData = await searchRes.json();

      if (!searchRes.ok || !searchData.success || searchData.families.length === 0) {
        throw new Error('Nenhuma família encontrada com este nome ou ID.');
      }

      const familyInfo = searchData.families[0];
      const familyId = familyInfo.familiaId || familyInfo.id;
      const familyName = familyInfo.familiaName || familyInfo.name || searchTerm;

      if (!familyId) {
        throw new Error('Não foi possível obter o ID da família.');
      }

      // 2. Buscar os documentos da família pelo ID
      const docsRes = await fetch(`${apiUrl}/api/submissions/family/${familyId}`);
      const docsData = await docsRes.json();

      if (!docsRes.ok || !docsData.success) {
        throw new Error('Erro ao buscar os documentos da família.');
      }

      const documents: Document[] = docsData.data.map((sub: any) => ({
        id: sub.id,
        documentType: sub.documentType,
        fileUrls: sub.fileUrls,
        uploadDate: sub.uploadDate,
      }));
      
      setFamily({ id: familyId, name: familyName, documents });

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao buscar os dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const openDocument = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Extrai o nome do arquivo da URL do Google Drive
  const getFilenameFromUrl = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      // Extrai o ID do arquivo e tenta usar como nome se não houver um nome melhor
      const pathSegments = parsedUrl.pathname.split('/');
      const fileId = pathSegments[pathSegments.length - 1];
      return fileId || 'Documento';
    } catch {
      return 'Link inválido';
    }
  }

  return (
    <Layout>
      <div className="container mx-auto p-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-light text-center text-slate-800 mb-8">Consulta de Documentos</h2>
          
          <form onSubmit={handleSearch} className="flex gap-4 mb-8">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o ID ou nome da família"
              className="w-full px-5 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 disabled:bg-slate-400 flex items-center gap-2"
            >
              {isLoading ? 'Buscando...' : <Search />}
              <span>{isLoading ? '' : 'Buscar'}</span>
            </button>
          </form>

          {isLoading && <p className="text-center text-lg text-slate-600 animate-pulse">Buscando informações...</p>}
          {error && <p className="text-center text-red-600 bg-red-50 p-4 rounded-lg">{error}</p>}
          
          {family && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 animate-fadeIn">
              <h3 className="text-3xl font-semibold text-green-900 mb-2">{family.name}</h3>
              <p className="text-slate-600 mb-6">ID da Família: {family.id}</p>
              
              <h4 className="text-xl font-medium text-slate-800 mb-4">Documentos</h4>
              {family.documents.length > 0 ? (
                <ul className="space-y-3">
                  {family.documents.flatMap(doc =>
                    doc.fileUrls.map((url, index) => (
                      <li key={`${doc.id}-${index}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                        <div>
                          <p className="font-semibold text-slate-800">{doc.documentType}</p>
                          <p className="text-sm text-slate-500">
                            Enviado em: {new Date(doc.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                        <button onClick={() => openDocument(url)} className="text-green-600 hover:text-green-700 p-2 rounded-full hover:bg-green-100 flex items-center gap-2">
                          <Eye className="w-5 h-5" />
                          <span>Visualizar</span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              ) : (
                <p className="text-center text-slate-500 bg-slate-100 p-4 rounded-lg">Nenhum documento encontrado para esta família.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
