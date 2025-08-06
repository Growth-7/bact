import React, { useState, useCallback, useEffect } from 'react';
import { Upload, ArrowRight, ArrowLeft, User, Users, X, Paperclip, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Layout from './Layout';
import { DocumentSubmission, SubmissionType, LocationType, REQUERENTE_DOCUMENT_TYPES, FAMILIA_DOCUMENT_TYPES } from '../types';
import axios from 'axios';
import { isUUID } from 'class-validator';

interface FamilyMember {
  id: string;
  name: string;
}

interface DocumentUploadScreenProps {
  location: LocationType;
  onNext: (data: DocumentSubmission) => void;
  onBack: () => void;
  initialData: Omit<DocumentSubmission, 'location'>;
  onDataChange: (data: Partial<Omit<DocumentSubmission, 'location'>>) => void;
}

export default function DocumentUploadScreen({ location, onNext, onBack, initialData, onDataChange }: DocumentUploadScreenProps) {
  const [formData, setFormData] = useState(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [showAddRequerente, setShowAddRequerente] = useState(false);
  const [newRequerenteName, setNewRequerenteName] = useState('');
  const [isAddingRequerente, setIsAddingRequerente] = useState(false);

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFormData(prev => ({ ...prev, files: [...prev.files, ...acceptedFiles] }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
  });

  const handleInputChange = (field: keyof typeof formData, value: string | SubmissionType) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleApplicantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedMember = familyMembers.find(m => m.id === selectedId);
    setFormData(prev => ({ ...prev, idRequerente: selectedId, nomeRequerente: selectedMember?.name || '' }));
  };

  useEffect(() => {
    const fetchFamilyMembers = async () => {
      if (formData.submissionType === 'requerente' && formData.idFamilia && isUUID(formData.idFamilia)) {
        setIsFetchingMembers(true);
        setError(null);
        try {
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const { data } = await axios.get(`${apiUrl}/api/auth/family-members/${formData.idFamilia}`);
          setFamilyMembers(data.success ? data.members : []);
          if (data.success && data.members.length > 0) {
            if (!formData.idRequerente) {
                const firstMember = data.members[0];
                setFormData(prev => ({ ...prev, idRequerente: firstMember.id, nomeRequerente: firstMember.name }));
            }
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
  }, [formData.idFamilia, formData.submissionType]);

  const removeFile = (fileToRemove: File) => {
    setFormData(prev => ({ ...prev, files: prev.files.filter(file => file !== fileToRemove) }));
  };

  const isFormValid = () => {
    const { files, nomeFamilia, idFamilia, idRequerente } = formData;
    if (files.length === 0 || !nomeFamilia?.trim() || !idFamilia?.trim()) return false;
    if (formData.submissionType === 'requerente' && !idRequerente?.trim()) return false;
    return true;
  };

  const handleAddRequerente = async () => {
    if (!newRequerenteName.trim()) {
      setError("O nome do requerente não pode estar vazio.");
      return;
    }
    if (!formData.idFamilia) {
        setError("O ID da Família é necessário para adicionar um requerente.");
        return;
    }
    setIsAddingRequerente(true);
    setError(null);

    try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const addRequerenteUrl = `${apiUrl}/api/auth/add-requerente`;

        const response = await axios.post(
            addRequerenteUrl,
            {
                nome: newRequerenteName,
                familia_id: formData.idFamilia,
            }
        );

      if (response.data && response.data.id) {
        const newMember = { id: response.data.id, name: newRequerenteName };
        setFamilyMembers(prev => [...prev, newMember]);
        setFormData(prev => ({ ...prev, idRequerente: newMember.id, nomeRequerente: newMember.name }));
        setShowAddRequerente(false);
        setNewRequerenteName('');
      } else {
        throw new Error(response.data.error || 'Falha ao adicionar requerente. O ID não foi retornado.');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || error.message || 'Ocorreu um erro ao adicionar o requerente.');
    } finally {
      setIsAddingRequerente(false);
    }
  };

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isFormValid()) {
      setError('Preencha os campos obrigatórios e envie ao menos um arquivo.');
      return;
    }
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      onNext({ ...formData, location });
    }, 1000);
  };
  
  const documentTypes = formData.submissionType === 'requerente' ? REQUERENTE_DOCUMENT_TYPES : FAMILIA_DOCUMENT_TYPES;

  return (
    <Layout title={`Envio de Documentos - ${location.charAt(0).toUpperCase() + location.slice(1)}`}>
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <form onSubmit={validateAndSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Envio</label>
            <div className="flex gap-4">
              <button type="button" onClick={() => handleInputChange('submissionType', 'requerente')} className={`flex-1 p-4 rounded-lg border-2 text-center ${formData.submissionType === 'requerente' ? 'border-blue-500 bg-blue-50' : 'hover:border-slate-300'}`}><User className="mx-auto mb-1" />Requerente</button>
              <button type="button" onClick={() => handleInputChange('submissionType', 'familia')} className={`flex-1 p-4 rounded-lg border-2 text-center ${formData.submissionType === 'familia' ? 'border-blue-500 bg-blue-50' : 'hover:border-slate-300'}`}><Users className="mx-auto mb-1" />Família</button>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="idFamilia" className="block text-sm font-medium mb-2">ID da Família *</label>
                <input id="idFamilia" type="text" value={formData.idFamilia || ''} onChange={(e) => handleInputChange('idFamilia', e.target.value)} className="w-full p-3 border rounded-lg" placeholder="Cole o ID da Família" />
              </div>
              <div>
                <label htmlFor="nomeFamilia" className="block text-sm font-medium mb-2">Nome da Família *</label>
                <input id="nomeFamilia" type="text" value={formData.nomeFamilia || ''} onChange={(e) => handleInputChange('nomeFamilia', e.target.value)} className="w-full p-3 border rounded-lg" placeholder="Digite o nome da família" />
              </div>
            </div>
            {formData.submissionType === 'requerente' && (
              <div>
                <label htmlFor="requerente" className="block text-sm font-medium mb-2">Selecione o Requerente *</label>
                <select id="requerente" value={formData.idRequerente || ''} onChange={handleApplicantChange} className="w-full p-3 border rounded-lg bg-white" disabled={isFetchingMembers || familyMembers.length === 0}>
                  {isFetchingMembers ? <option>Buscando...</option> : familyMembers.length > 0 ? familyMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>) : <option>Nenhum membro encontrado</option>}
                </select>
                {location === 'alphaville' && (
                  <div className="mt-2">
                    <button type="button" onClick={() => setShowAddRequerente(!showAddRequerente)} className="text-sm text-blue-600 hover:underline">
                      Não encontrou o requerente? Adicione um novo.
                    </button>
                    {showAddRequerente && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={newRequerenteName}
                          onChange={(e) => setNewRequerenteName(e.target.value)}
                          className="w-full p-2 border rounded-lg"
                          placeholder="Nome do novo requerente"
                        />
                        <button type="button" onClick={handleAddRequerente} disabled={isAddingRequerente} className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:bg-slate-400">
                          {isAddingRequerente ? <Loader2 className="animate-spin"/> : 'Adicionar'}
                        </button>
                      </div>
                    )}
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
            <div {...getRootProps()} className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300'}`}>
              <input {...getInputProps()} />
              <Upload className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p>Arraste arquivos ou <span className="text-blue-600">clique para selecionar</span></p>
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
            <button type="submit" disabled={!isFormValid() || isValidating} className="bg-blue-600 text-white p-3 rounded-lg flex items-center gap-2 disabled:bg-slate-400">
              {isValidating ? <><Loader2 className="animate-spin" /> Validando...</> : <><ArrowRight/> Continuar</>}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
