import { useState } from 'react';
import { FileText, Eye, Download, Calendar, User, ArrowLeft, FolderOpen, Users, Building2, UserCheck } from 'lucide-react';
import Layout from './Layout';
import { DocumentSubmission, Family, DOCUMENT_TYPES, FAMILY_DOCUMENT_TYPES, DocumentTypeOption } from '../types';

interface DocumentsListScreenProps {
  family: Family;
  documents: DocumentSubmission[];
  members?: Array<{ id: string; name: string; customer_type: string }>;
  onBack: () => void;
  onAddDocument: () => void;
  onAddDocumentForRequester?: (member: { id: string; name: string }) => void;
  onAddFamilyDocument: () => void;
  onCompleteFamily: () => void;
}

export default function DocumentsListScreen({ family, documents, members = [], onBack, onAddDocument, onAddDocumentForRequester, onAddFamilyDocument, onCompleteFamily }: DocumentsListScreenProps) {
  const [selectedRequester, setSelectedRequester] = useState<string | null>(null);
  const [selectedFamilyDocs, setSelectedFamilyDocs] = useState<boolean>(false);

  const formatDate = (dateLike: Date | string | undefined | null) => {
    if (!dateLike) return '-';
    const date = dateLike instanceof Date ? dateLike : new Date(dateLike);
    if (isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getDocumentTypeLabel = (type: string) => {
    const requesterDoc = DOCUMENT_TYPES.find((docType: DocumentTypeOption) => docType.value === type);
    const familyDoc = FAMILY_DOCUMENT_TYPES.find((docType: DocumentTypeOption) => docType.value === type);
    return requesterDoc?.label || familyDoc?.label || type;
  };

  const getCanonicalType = (code: string): 'italian' | 'req' | 'family' | 'spouse' | 'underage' | 'responsible' | 'other' => {
    if (!code) return 'other';
    const normalized = String(code).toLowerCase();
    if (normalized === 'italian') return 'italian';
    if (normalized === 'req' || normalized === 'requerente') return 'req';
    if (normalized === 'family-member' || normalized === 'family_member' || normalized === 'familiar') return 'family';
    if (normalized === 'spouse') return 'spouse';
    if (normalized === 'underage') return 'underage';
    if (normalized === 'responsible') return 'responsible';
    return 'other';
  };

  const translateCustomerType = (code: string) => {
    const canonical = getCanonicalType(code);
    const map: Record<ReturnType<typeof getCanonicalType>, string> = {
      italian: 'Italiano',
      req: 'Requerente',
      family: 'Familiar',
      spouse: 'Cônjuge',
      underage: 'Menor',
      responsible: 'Responsável',
      other: 'Outro',
    };
    return map[canonical];
  };

  // Separar documentos da família e dos requerentes
  const familyDocuments = documents.filter((d) => d.category === 'family');
  const requesterDocuments = documents.filter((d) => d.category === 'requester');

  // Organizar documentos dos requerentes por nome
  const documentsByRequester = requesterDocuments.reduce((acc, d) => {
    const requesterName = d.requesterName || 'Requerente';
    if (!acc[requesterName]) {
      acc[requesterName] = [] as DocumentSubmission[];
    }
    acc[requesterName].push(d);
    return acc;
  }, {} as Record<string, DocumentSubmission[]>);

  // Preview e download desabilitados nesta versão

  return (
    <Layout title={`Documentos - Família ${family.name}`}>
      <div className="animate-slideIn">
        {/* Header da Família - Maior e mais destacado */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl shadow-xl p-8 mb-8 transform hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Família {family.name}
                </h2>
                <p className="text-blue-100 text-lg mb-2">
                  ID: {family.id}
                </p>
                <p className="text-blue-100">
                  <strong>Membros:</strong>{' '}
                  {(() => {
                    const maxDisplay = 10;
                    const names = family.members || [];
                    const visible = names.slice(0, maxDisplay);
                    const extra = Math.max(0, names.length - maxDisplay);
                    return `${visible.join(', ')}${extra > 0 ? ` e +${extra}` : ''}`;
                  })()}
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-2xl p-6 min-w-[120px]">
                <div className="text-4xl font-bold mb-2">{documents.length}</div>
                <div className="text-blue-100 text-sm font-medium">
                  {documents.length === 1 ? 'Documento' : 'Documentos'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botão Adicionar Documento - Mais destacado */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onAddFamilyDocument}
              title="Adicionar documento da família (CNN, Procuração)"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 flex items-center space-x-3 group shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Building2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span>Adicionar Documento da Família</span>
            </button>
            
            <button
              onClick={onAddDocument}
              title="Adicionar documento de requerente (Certidões)"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 flex items-center space-x-3 group shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <UserCheck className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>Adicionar Documento de Requerente</span>
            </button>
          </div>
        </div>

        {/* Seção de Documentos da Família */}
        <div className="mb-12">
          <div className="flex items-center my-8">
            <div className="flex-1 h-px bg-slate-300"></div>
            <div className="px-4 text-slate-500 font-medium text-sm">DOCUMENTOS DA FAMÍLIA</div>
            <div className="flex-1 h-px bg-slate-300"></div>
          </div>

          {familyDocuments.length === 0 ? (
            <div className="text-center py-12 bg-blue-50 rounded-2xl border border-blue-200 animate-fadeIn">
              <Building2 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-blue-600 mb-2">Nenhum documento da família</h3>
              <p className="text-blue-500 mb-6">CNN e Procuração ainda não foram adicionados.</p>
              <button
                onClick={onAddFamilyDocument}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                Adicionar Primeiro Documento da Família
              </button>
            </div>
          ) : (
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
              <div 
                className="bg-white rounded-2xl shadow-lg border border-blue-200 overflow-hidden animate-slideIn cursor-pointer"
                onClick={() => setSelectedFamilyDocs(!selectedFamilyDocs)}
              >
                <div className="bg-white border-b border-blue-200 p-6 hover:bg-blue-50 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-3 rounded-xl">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">Documentos da Família</h3>
                        <p className="text-slate-600">
                          {familyDocuments.length} {familyDocuments.length === 1 ? 'documento' : 'documentos'}
                        </p>
                      </div>
                    </div>
                    <div className={`transform transition-transform duration-200 ${
                      selectedFamilyDocs ? 'rotate-180' : ''
                    }`}>
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className={`transition-all duration-300 overflow-hidden ${
                  selectedFamilyDocs ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="p-6 space-y-4">
                    {familyDocuments.map((docItem, docIndex) => (
                      <div
                        key={docItem.id || `${docIndex}`}
                        className="border border-blue-200 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group animate-slideIn"
                        style={{ animationDelay: `${docIndex * 50}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <h4 className="text-lg font-semibold text-slate-900 group-hover:text-blue-900 transition-colors duration-200">
                                {docItem.fileName || docItem.files?.[0]?.name}
                              </h4>
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                {getDocumentTypeLabel(docItem.documentType || '')}
                              </span>
                            </div>
                            
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{docItem.uploadDate ? formatDate(docItem.uploadDate) : '-'}</span>
                              </div>
                            {/* Link removido aqui; o atalho de visualização fica no canto direito com ícone */}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3 ml-6">
                            {Array.isArray((docItem as any).fileUrls) && (docItem as any).fileUrls.length > 0 && (
                              <a
                                href={(docItem as any).fileUrls[0]}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Visualizar no Drive"
                                className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                              >
                                <Eye className="w-5 h-5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seção de “pastas” de requerentes */}
        <div className="mb-8">
          <div className="flex items-center my-8">
            <div className="flex-1 h-px bg-slate-300"></div>
            <div className="px-4 text-slate-500 font-medium text-sm">DOCUMENTOS DOS REQUERENTES ({members.length})</div>
            <div className="flex-1 h-px bg-slate-300"></div>
          </div>

          {members.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl animate-fadeIn">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Nenhum requerente encontrado para esta família.</p>
            </div>
          ) : (
            <div className="max-h-[480px] overflow-y-auto pr-2 space-y-10">
              {(() => {
                const groupsOrder: Array<ReturnType<typeof getCanonicalType>> = ['italian','req','spouse','underage','responsible','family','other'];
                const grouped = new Map<ReturnType<typeof getCanonicalType>, typeof members>();
                for (const m of members) {
                  const key = getCanonicalType(m.customer_type);
                  const list = grouped.get(key) || [];
                  list.push(m);
                  grouped.set(key, list);
                }

                const renderCard = (m: { id: string; name: string; customer_type: string }) => {
                  const mid = (m.id || '').toLowerCase();
                  const mname = (m.name || '').toLowerCase().trim();
                  const sourceDocs = requesterDocuments;
                  const matcher = (d: DocumentSubmission) => {
                    const did = (d.idRequerente || '').toLowerCase();
                    return Boolean(did) && Boolean(mid) && did === mid;
                  };
                  const docsForMember = sourceDocs
                    .filter(matcher)
                    .sort((a, b) => {
                      const ta = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
                      const tb = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
                      return tb - ta;
                    });
                  const recentTypeLabels: string[] = [];
                  for (const d of docsForMember) {
                    const label = getDocumentTypeLabel(d.documentType || '');
                    if (label && !recentTypeLabels.includes(label)) {
                      recentTypeLabels.push(label);
                    }
                    if (recentTypeLabels.length >= 2) break;
                  }
                  const status = recentTypeLabels.length > 0
                    ? `Enviado: ${recentTypeLabels.join(', ')}`
                    : 'Nenhum documento';
                  return (
                    <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 min-h-[11rem] flex flex-col overflow-hidden">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="bg-green-100 p-3 rounded-xl">
                          <User className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-lg font-semibold text-slate-900 truncate" title={m.name}>{m.name}</h4>
                          <p className="text-slate-500 text-sm">{translateCustomerType(m.customer_type)}</p>
                          <div className="mt-1 text-xs">
                            {docsForMember.length > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                                {status}
                              </span>
                            ) : (
                              <span className="text-slate-400">{status}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-auto space-y-2">
                        <button
                          onClick={() => onAddDocumentForRequester?.({ id: m.id, name: m.name })}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Adicionar Documento</span>
                        </button>
                        <div className="text-[11px] text-slate-400 truncate pb-1" title={m.id}>ID: {m.id}</div>
                      </div>
                    </div>
                  );
                };

                return groupsOrder.map((key) => {
                  const list = grouped.get(key) || [];
                  if (list.length === 0) return null;
                  return (
                    <section key={key} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-slate-700 font-medium">{translateCustomerType(key)}</h4>
                        <span className="text-slate-400 text-sm">{list.length}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                        {list.map(renderCard)}
                      </div>
                    </section>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {requesterDocuments.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl animate-fadeIn">
            <FolderOpen className="w-20 h-20 text-slate-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-slate-600 mb-4">Nenhum documento de requerente</h3>
            <p className="text-slate-500 mb-8 text-lg">Ainda não há certidões de requerentes cadastradas.</p>
            <button
              onClick={onAddDocument}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              Adicionar Primeiro Documento de Requerente
            </button>
          </div>
        ) : (
            <div className="bg-slate-50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Requerentes</h3>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="p-1 rounded-lg text-blue-600"
                      aria-hidden
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    {Object.keys(documentsByRequester).length} {Object.keys(documentsByRequester).length === 1 ? 'requerente' : 'requerentes'} com documentos
                  </p>
                </div>
              </div>
              <div className="bg-white px-3 py-1 rounded-full border border-slate-200">
                <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  {requesterDocuments.length} {requesterDocuments.length === 1 ? 'documento' : 'documentos'} total
                </span>
              </div>
            </div>
            
            <div className="space-y-6">
            {Object.entries(documentsByRequester).map(([requesterName, requesterDocs], index) => (
              <div 
                key={requesterName} 
                className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-slideIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header do Requerente */}
                <div 
                  className="bg-white border-b border-slate-200 p-6 cursor-pointer hover:bg-slate-50 transition-all duration-200"
                  onClick={() => setSelectedRequester(selectedRequester === requesterName ? null : requesterName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 p-3 rounded-xl">
                        <User className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">{requesterName}</h3>
                        <p className="text-slate-600">
                          {requesterDocs.length} {requesterDocs.length === 1 ? 'documento' : 'documentos'}
                        </p>
                      </div>
                    </div>
                    <div className={`transform transition-transform duration-200 ${
                      selectedRequester === requesterName ? 'rotate-180' : ''
                    }`}>
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Documentos do Requerente */}
                <div className={`transition-all duration-300 overflow-hidden ${
                  selectedRequester === requesterName ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="p-6 space-y-4">
                    {requesterDocs.map((docItem, docIndex) => (
                      <div
                        key={docItem.id || `${docIndex}`}
                        className="border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group animate-slideIn"
                        style={{ animationDelay: `${docIndex * 50}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <h4 className="text-lg font-semibold text-slate-900 group-hover:text-blue-900 transition-colors duration-200">
                                {docItem.fileName || docItem.files?.[0]?.name}
                              </h4>
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                {getDocumentTypeLabel(docItem.documentType || '')}
                              </span>
                            </div>
                            
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>{docItem.uploadDate ? formatDate(docItem.uploadDate) : '-'}</span>
                                </div>
                                {Array.isArray((docItem as any).fileUrls) && (docItem as any).fileUrls.length > 0 && (
                                  <div className="flex items-center justify-end">
                                    <a
                                      href={(docItem as any).fileUrls[0]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Visualizar no Drive"
                                      className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                                    >
                                      <Eye className="w-5 h-5" />
                                    </a>
                                  </div>
                                )}
                              </div>
                          </div>
                          
                        <div className="flex items-center space-x-3 ml-6" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-8 border-t border-slate-200 mt-12">
          <button
            type="button"
            onClick={onBack}
            title="Voltar para busca de família"
            className="flex items-center space-x-2 px-6 py-3 text-slate-600 hover:text-slate-800 transition-all duration-200 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <button
            type="button"
            title="Marcar família como concluída"
            onClick={async () => {
              try {
                const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
                const token = localStorage.getItem('authToken') || '';
                const payload = JSON.parse(atob(token.split('.')[1] || 'null') || 'null');
                const userId = payload?.id;
                if (!userId) return;
                await fetch(`${apiUrl}/api/submissions/family/${family.id}/complete`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId, familyName: family.name })
                });
                onCompleteFamily();
              } catch {}
            }}
            className="px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            Concluir Família
          </button>
        </div>
      </div>

    </Layout>
  );
}