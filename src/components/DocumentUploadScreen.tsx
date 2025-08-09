import React, { useState, useCallback, useEffect } from 'react';
import { Upload, ArrowRight, ArrowLeft, User, Users, X, Paperclip, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Layout from './Layout';
import { DocumentSubmission, SubmissionType, LocationType, REQUERENTE_DOCUMENT_TYPES, FAMILIA_DOCUMENT_TYPES } from '../types';
import axios from 'axios';

interface FamilyMember {
  id: string;
  name: string;
  customer_type: string;
}

interface DocumentUploadScreenProps {
  location: LocationType;
  onNext: (data: DocumentSubmission) => void;
  onBack: () => void;
  initialData?: DocumentSubmission | null;
  existingDocuments?: DocumentSubmission[];
}

export default function DocumentUploadScreen({ location, onNext, onBack, initialData, existingDocuments = [] }: DocumentUploadScreenProps) {
  const isValidUUID = (value: string): boolean => {
    if (!value) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value.trim());
  };
  const [submissionType, setSubmissionType] = useState<SubmissionType>(initialData?.submissionType || 'requerente');
  const [formData, setFormData] = useState<Omit<DocumentSubmission, 'location' | 'submissionType'>>({
    nomeRequerente: initialData?.nomeRequerente || '',
    idRequerente: initialData?.idRequerente || '',
    nomeFamilia: initialData?.nomeFamilia || '',
    idFamilia: initialData?.idFamilia || '',
    documentType: initialData?.documentType || REQUERENTE_DOCUMENT_TYPES[0],
    files: initialData?.files || [],
  });
  const isRequesterLocked = Boolean(initialData?.idRequerente);
  const isFamilyLocked = Boolean(initialData?.idFamilia || initialData?.nomeFamilia);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [isCreatingRequerente, setIsCreatingRequerente] = useState(false);
  const [novoRequerenteNome, setNovoRequerenteNome] = useState('');
  const [hasDuplicate, setHasDuplicate] = useState(false);
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);


  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFormData(prev => ({ ...prev, files: [...prev.files, ...acceptedFiles] }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleApplicantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedMember = familyMembers.find(m => m.id === selectedId);
    setFormData(prev => ({ ...prev, idRequerente: selectedId, nomeRequerente: selectedMember?.name || '' }));
  };

  useEffect(() => {
    const fetchFamilyMembers = async () => {
      if (submissionType === 'requerente' && formData.idFamilia && isValidUUID(formData.idFamilia)) {
        setIsFetchingMembers(true);
        setError(null);
        try {
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const { data } = await axios.get(`${apiUrl}/api/auth/family-members/${formData.idFamilia}`);
          setFamilyMembers(data.success ? data.members : []);
          if (data.success && data.members.length > 0) {
            setFormData(prev => ({ 
              ...prev, 
              nomeFamilia: data.familyName || prev.nomeFamilia,
              // Só define o primeiro membro por padrão se não houver requerente pré-selecionado (fluxo bloqueado)
              ...(isRequesterLocked ? {} : { 
                idRequerente: prev.idRequerente || data.members[0].id,
                nomeRequerente: prev.nomeRequerente || data.members[0].name,
              }),
            }));
          } else {
            setFormData(prev => ({...prev, idRequerente: '', nomeRequerente: ''}));
          }
        } catch (err: any) {
          setError(err.response?.data?.message || 'Erro ao buscar membros.');
          setFamilyMembers([]);
        } finally {
          setIsFetchingMembers(false);
        }
      } else {
        setFamilyMembers([]);
      }
    };
    const timer = setTimeout(fetchFamilyMembers, 500);
    return () => clearTimeout(timer);
  }, [formData.idFamilia, submissionType]);

  const removeFile = (fileToRemove: File) => {
    setFormData(prev => ({ ...prev, files: prev.files.filter(file => file !== fileToRemove) }));
  };

  const isFormValid = () => {
    const { files, nomeFamilia, idFamilia, idRequerente } = formData;
    if (files.length === 0 || !nomeFamilia?.trim() || !idFamilia?.trim()) return false;
    if (submissionType === 'requerente') {
        if (isCreatingRequerente) {
            return novoRequerenteNome.trim() !== '';
        }
        return idRequerente?.trim() !== '';
    }
    return true;
  };

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (hasDuplicate && !confirmDuplicate) {
      setError('Já existe um envio deste tipo para este destinatário. Confirme se deseja continuar.');
      return;
    }
    if (!isFormValid()) {
      setError('Preencha os campos obrigatórios e envie ao menos um arquivo.');
      return;
    }
    setIsValidating(true);
    let submissionData = { ...formData };

    try {
        if (submissionType === 'requerente' && isCreatingRequerente) {
            console.log('Criando novo requerente...');
            const apiUrl = import.meta.env.VITE_API_URL || '';
            const response = await axios.post(`${apiUrl}/api/auth/requerente`, {
                familyName: formData.nomeFamilia,
                idFamilia: formData.idFamilia,
                requerenteName: novoRequerenteNome
            });
            
            if (response.data && response.data.success && response.data.idRequerente) {
                submissionData.idRequerente = response.data.idRequerente;
                submissionData.nomeRequerente = novoRequerenteNome;
            } else {
                throw new Error(response.data.message || 'Falha ao criar novo requerente.');
            }
        }
      onNext({ ...submissionData, submissionType, location });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Ocorreu um erro.');
    } finally {
      setIsValidating(false);
    }
  };
  
  const documentTypes = submissionType === 'requerente' ? REQUERENTE_DOCUMENT_TYPES : FAMILIA_DOCUMENT_TYPES;
  
  useEffect(() => {
    const type = formData.documentType;
    if (!type) { setHasDuplicate(false); setConfirmDuplicate(false); return; }
    const isFamily = submissionType === 'familia';
    const duplicate = existingDocuments.some((d) => {
      if (!d.documentType) return false;
      if (d.documentType !== type) return false;
      if (isFamily) return d.submissionType === 'familia' && (d.idFamilia || '').toLowerCase() === (formData.idFamilia || '').toLowerCase();
      return d.submissionType === 'requerente'
        && !!formData.idRequerente
        && (d.idRequerente || '').toLowerCase() === (formData.idRequerente || '').toLowerCase();
    });
    setHasDuplicate(duplicate);
    if (!duplicate) setConfirmDuplicate(false);
  }, [submissionType, formData.documentType, formData.idFamilia, formData.idRequerente, existingDocuments]);

  return (
    <Layout title={`Envio de Documentos - ${location.charAt(0).toUpperCase() + location.slice(1)}`}>
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <form onSubmit={validateAndSubmit} className="space-y-8">
          {!isRequesterLocked && (
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Envio</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setSubmissionType('requerente')}
                  className={`flex-1 p-4 rounded-lg border-2 text-center ${submissionType === 'requerente' ? 'border-blue-500 bg-blue-50' : 'hover:border-slate-300'}`}
                >
                  <User className="mx-auto mb-1" />Requerente
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionType('familia')}
                  className={`flex-1 p-4 rounded-lg border-2 text-center ${submissionType === 'familia' ? 'border-blue-500 bg-blue-50' : 'hover:border-slate-300'}`}
                >
                  <Users className="mx-auto mb-1" />Família
                </button>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="idFamilia" className="block text-sm font-medium mb-2">ID da Família *</label>
                <input id="idFamilia" type="text" value={formData.idFamilia || ''} onChange={(e) => handleInputChange('idFamilia', e.target.value)} className={`w-full p-3 border rounded-lg ${isFamilyLocked ? 'bg-slate-100 cursor-not-allowed' : ''}`} placeholder="Cole o ID da Família" disabled={isFamilyLocked} />
              </div>
              <div>
                <label htmlFor="nomeFamilia" className="block text-sm font-medium mb-2">Nome da Família *</label>
                <input id="nomeFamilia" type="text" value={formData.nomeFamilia || ''} onChange={(e) => handleInputChange('nomeFamilia', e.target.value)} className={`w-full p-3 border rounded-lg ${isFamilyLocked ? 'bg-slate-100 cursor-not-allowed' : ''}`} placeholder="Digite o nome da família" disabled={isFamilyLocked} />
              </div>
            </div>
            {submissionType === 'requerente' && location === 'alphaville' && (
              <div>
                <label htmlFor="requerente" className="block text-sm font-medium mb-2">
                  {isRequesterLocked ? 'Requerente Selecionado' : (isCreatingRequerente ? 'Novo Requerente' : 'Selecione o Requerente *')}
                </label>
                {isRequesterLocked ? (
                  <div className="p-3 border rounded-lg bg-slate-50 text-slate-700">
                    {formData.nomeRequerente} <span className="text-slate-400 text-xs">(ID: {formData.idRequerente})</span>
                  </div>
                ) : !isCreatingRequerente ? (
                  <div className="flex items-center gap-2">
                    <select 
                      id="requerente" 
                      value={formData.idRequerente || ''} 
                      onChange={handleApplicantChange} 
                      className="flex-grow w-full p-3 border rounded-lg bg-white" 
                      disabled={isFetchingMembers}
                    >
                      {isFetchingMembers ? (
                        <option>Buscando...</option> 
                      ) : (
                        familyMembers.length > 0 ? (
                          familyMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>) 
                        ) : (
                          <option disabled value="">Nenhum membro encontrado</option>
                        )
                      )}
                    </select>
                    {!isRequesterLocked && (
                      <button 
                        type="button" 
                        onClick={() => setIsCreatingRequerente(true)}
                        className="bg-blue-600 text-white p-3 rounded-lg flex-shrink-0"
                        disabled={isFetchingMembers}
                      >
                        Adicionar
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                      <div className="flex-grow">
                          <input id="novoRequerenteNome" type="text" value={novoRequerenteNome} onChange={(e) => setNovoRequerenteNome(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="Digite o nome completo do requerente" />
                      </div>
                      <button type="button" onClick={() => setIsCreatingRequerente(false)} className="bg-slate-200 text-slate-800 p-3 rounded-lg">
                          Cancelar
                      </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div>
            <label htmlFor="documentType" className="block text-sm font-medium mb-2">Tipo de Documento</label>
            <select id="documentType" value={formData.documentType} onChange={(e) => handleInputChange('documentType', e.target.value)} className="w-full p-3 border rounded-lg bg-white">
              {documentTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Upload de Documentos (PDF) *</label>
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                formData.files.length > 0
                  ? 'border-green-500 bg-green-50'
                  : isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className={`w-10 h-10 mx-auto mb-2 ${formData.files.length > 0 ? 'text-green-600' : 'text-slate-400'}`} />
              {formData.files.length > 0 ? (
                <p className="text-green-700 font-medium">{formData.files.length} arquivo(s) anexado(s)</p>
              ) : (
                <p>Arraste arquivos ou <span className="text-blue-600">clique para selecionar</span></p>
              )}
            </div>
            {formData.files.length > 0 && (
              <ul className="mt-4 space-y-2">
                {formData.files.map((file, i) => (
                  <li key={i} className="flex items-center justify-between bg-slate-100 p-2 rounded-lg">
                    <div className="flex items-center gap-2"><Paperclip className="w-5 h-5" /><span>{file.name}</span></div>
                    <button type="button" onClick={() => removeFile(file)}><X className="w-5 h-5 text-red-500" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>}

          <div className="flex items-center justify-between pt-6 border-t">
            <button type="button" onClick={onBack} className="flex items-center gap-2 px-4 py-2"><ArrowLeft/> Voltar</button>
            <div className="flex items-center gap-3">
              {hasDuplicate && !confirmDuplicate && (
                <button type="button" onClick={() => setConfirmDuplicate(true)} className="bg-red-600 text-white p-3 rounded-lg">
                  Já existe envio deste tipo. Deseja continuar?
                </button>
              )}
              <button type="submit" disabled={!isFormValid() || isValidating} className="bg-blue-600 text-white p-3 rounded-lg flex items-center gap-2 disabled:bg-slate-400">
                {isValidating ? <><Loader2 className="animate-spin" /> Validando...</> : <><ArrowRight/> Continuar</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
