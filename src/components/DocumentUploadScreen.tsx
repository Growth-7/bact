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
}

export default function DocumentUploadScreen({ location, onNext, onBack }: DocumentUploadScreenProps) {
  const [submissionType, setSubmissionType] = useState<SubmissionType>('requerente');
  const [formData, setFormData] = useState<Omit<DocumentSubmission, 'location' | 'submissionType'>>({
    nomeRequerente: '',
    idRequerente: '',
    nomeFamilia: '',
    idFamilia: '',
    documentType: REQUERENTE_DOCUMENT_TYPES[0],
    files: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);

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
      if (submissionType === 'requerente' && formData.idFamilia && isUUID(formData.idFamilia)) {
        setIsFetchingMembers(true);
        setError(null);
        try {
          const { data } = await axios.get(`http://localhost:3333/api/auth/family-members/${formData.idFamilia}`);
          setFamilyMembers(data.success ? data.members : []);
          if (data.success && data.members.length > 0) {
            setFormData(prev => ({ ...prev, idRequerente: data.members[0].id, nomeRequerente: data.members[0].name }));
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
    if (submissionType === 'requerente' && !idRequerente?.trim()) return false;
    return true;
  };

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isFormValid()) {
      setError('Preencha os campos obrigatórios e envie ao menos um arquivo.');
      return;
    }
    setIsValidating(true);
    try {
      // Sua lógica de validação com a Edge Function aqui...
      console.log('Validando IDs...');
    } catch (err) {
      // Tratar erro
    } finally {
      setIsValidating(false);
    }
    onNext({ ...formData, submissionType, location });
  };
  
  const documentTypes = submissionType === 'requerente' ? REQUERENTE_DOCUMENT_TYPES : FAMILIA_DOCUMENT_TYPES;

  return (
    <Layout title={`Envio de Documentos - ${location.charAt(0).toUpperCase() + location.slice(1)}`}>
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <form onSubmit={validateAndSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Envio</label>
            <div className="flex gap-4">
              <button type="button" onClick={() => setSubmissionType('requerente')} className={`flex-1 p-4 rounded-lg border-2 text-center ${submissionType === 'requerente' ? 'border-blue-500 bg-blue-50' : 'hover:border-slate-300'}`}><User className="mx-auto mb-1" />Requerente</button>
              <button type="button" onClick={() => setSubmissionType('familia')} className={`flex-1 p-4 rounded-lg border-2 text-center ${submissionType === 'familia' ? 'border-blue-500 bg-blue-50' : 'hover:border-slate-300'}`}><Users className="mx-auto mb-1" />Família</button>
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
            {submissionType === 'requerente' && (
              <div>
                <label htmlFor="requerente" className="block text-sm font-medium mb-2">Selecione o Requerente *</label>
                <select id="requerente" value={formData.idRequerente || ''} onChange={handleApplicantChange} className="w-full p-3 border rounded-lg bg-white" disabled={isFetchingMembers || familyMembers.length === 0}>
                  {isFetchingMembers ? <option>Buscando...</option> : familyMembers.length > 0 ? familyMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>) : <option>Nenhum membro encontrado</option>}
                </select>
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
