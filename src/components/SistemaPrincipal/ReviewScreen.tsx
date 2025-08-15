import React, { useState } from 'react';
import { Send, ArrowLeft, Eye, Paperclip, Loader2, User, Users, MapPin, FileText, X } from 'lucide-react';
import Layout from '../Layout';
import { DocumentSubmission, User as UserType } from '../../types';
import axios from 'axios';

interface ReviewScreenProps {
  data: DocumentSubmission;
  user: UserType;
  onBack: () => void;
  onSubmit: (result: { submissionId: string }) => void; // Alterado
}

const InfoCard = ({ icon, label, value, capitalize = false }: { icon: React.ReactNode, label: string, value?: string, capitalize?: boolean }) => (
    <div className="bg-slate-50 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
            {icon}
            <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        <p className={`text-lg font-semibold text-slate-900 ${capitalize ? 'capitalize' : ''}`}>{value || '-'}</p>
    </div>
);

export default function ReviewScreen({ data, user, onBack, onSubmit }: ReviewScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileToPreview, setFileToPreview] = useState<File | null>(null);
  const [viewedFiles, setViewedFiles] = useState(new Set<string>());
  const [error, setError] = useState<string | null>(null);

  const handlePreviewFile = (file: File) => {
    setViewedFiles(prev => new Set(prev).add(file.name));
    setFileToPreview(file);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'files') {
        data.files.forEach(file => formData.append('files', file));
      } else if (value) {
        formData.append(key, value as string);
      }
    });
    formData.append('userId', user.id);
    formData.append('bitrixUserId', user.user_id_bitrix24);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.post(`${apiUrl}/api/submissions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) {
        // Envia o ID da submissão para o App.tsx
        onSubmit({ submissionId: response.data.submissionId });
      } else {
        setError(response.data.message || 'Ocorreu um erro no envio.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível conectar ao servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDocumentPreview = () => {
    if (!fileToPreview) return null;
    const fileUrl = URL.createObjectURL(fileToPreview);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full h-[90vh] flex flex-col">
          <div className="p-2 border-b flex justify-between items-center">
            <h3 className="font-semibold ml-4">{fileToPreview.name}</h3>
            <button onClick={() => setFileToPreview(null)} className="p-2 rounded-full hover:bg-slate-100"><X size={20} /></button>
          </div>
          <div className="p-4 flex-grow">
            <iframe src={fileUrl} className="w-full h-full border-0" title={fileToPreview.name} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout title="Conferência das Informações">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 fade-in">
        <p className="text-slate-600 mb-6">Revise as informações abaixo antes de enviar.</p>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard icon={<MapPin className="w-4 h-4" />} label="Localização" value={data.location} capitalize />
            <InfoCard icon={<FileText className="w-4 h-4" />} label="Tipo de Envio" value={data.submissionType} capitalize />
            <InfoCard icon={<Users className="w-4 h-4" />} label="ID da Família" value={data.idFamilia} />
            <InfoCard icon={<Users className="w-4 h-4" />} label="Nome da Família" value={data.nomeFamilia} />
            {data.submissionType === 'requerente' && (
              <>
                <InfoCard icon={<User className="w-4 h-4" />} label="ID do Requerente" value={data.idRequerente} />
                <InfoCard icon={<User className="w-4 h-4" />} label="Nome do Requerente" value={data.nomeRequerente} />
              </>
            )}
            <InfoCard icon={<FileText className="w-4 h-4" />} label="Tipo de Documento" value={data.documentType} />
          </div>
          <div>
            <h3 className="font-medium text-slate-800 mb-2">Documentos Enviados</h3>
            <ul className="space-y-2">
              {data.files.map((file, index) => (
                <li key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Paperclip className="w-5 h-5 text-slate-500" />
                    <span className="font-medium">{file.name}</span>
                    {viewedFiles.has(file.name) && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Visto</span>}
                  </div>
                  <button onClick={() => handlePreviewFile(file)} className="flex items-center gap-1 text-blue-600 hover:underline text-sm">
                    <Eye className="w-4 h-4" /> Visualizar
                  </button>
                </li>
              ))}
            </ul>
            {data.files.length > viewedFiles.size && (
              <p className="text-sm text-amber-600 mt-2">
                Você precisa visualizar todos os {data.files.length} arquivos para poder enviar. Faltam {data.files.length - viewedFiles.size}.
              </p>
            )}
          </div>
        </div>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mt-6">{error}</div>}
        <div className="flex items-center justify-between pt-6 border-t mt-8">
          <button onClick={onBack} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-3 disabled:opacity-50">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting || viewedFiles.size < data.files.length} className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-medium py-3 px-6 rounded-lg flex items-center gap-2">
            {isSubmitting ? <><Loader2 className="animate-spin" /> Enviando...</> : <><Send /> Enviar Documentos</>}
          </button>
        </div>
      </div>
      {renderDocumentPreview()}
    </Layout>
  );
}
