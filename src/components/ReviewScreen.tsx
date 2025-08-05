import React, { useState } from 'react';
import { Check, ArrowLeft, FileText, User, Users, Send, Building, MapPin, Eye } from 'lucide-react';
import Layout from './Layout';
import { DocumentSubmission, DOCUMENT_TYPES, SUBMISSION_TYPES } from '../types';

interface ReviewScreenProps {
  data: DocumentSubmission;
  onBack: () => void;
  onSubmit: () => void;
}

export default function ReviewScreen({ data, onBack, onSubmit }: ReviewScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDocument, setShowDocument] = useState(false);

  const documentTypeLabel = DOCUMENT_TYPES.find(type => type.value === data.documentType)?.label || '';
  const submissionTypeLabel = SUBMISSION_TYPES.find(type => type.value === data.submissionType)?.label || '';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate submission delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    onSubmit();
  };

  const renderDocumentPreview = () => {
    if (!data.file) return null;

    const fileUrl = URL.createObjectURL(data.file);
    const isImage = data.file.type.startsWith('image/');
    const isPdf = data.file.type === 'application/pdf';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Visualização do Documento</h3>
            <button
              onClick={() => setShowDocument(false)}
              className="text-slate-500 hover:text-slate-700 text-xl font-bold"
            >
              ×
            </button>
          </div>
          <div className="p-4">
            {isImage ? (
              <img
                src={fileUrl}
                alt="Documento"
                className="max-w-full h-auto rounded-lg"
              />
            ) : isPdf ? (
              <iframe
                src={fileUrl}
                className="w-full h-96 rounded-lg"
                title="Documento PDF"
              />
            ) : (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Visualização não disponível para este tipo de arquivo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSubmissionDetails = () => {
    switch (data.submissionType) {
      case 'certidao':
        if (data.location === 'carrao') {
          return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Carrão - Processo Simplificado</span>
              </div>
              <p className="text-blue-700 text-sm">Apenas documento necessário, sem validação de IDs.</p>
            </div>
          );
        }
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">ID da Família</span>
              </div>
              <p className="text-lg font-semibold text-slate-900">{data.familyId}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">ID do Requerente</span>
              </div>
              <p className="text-lg font-semibold text-slate-900">{data.applicantId}</p>
            </div>
          </div>
        );
      
      case 'requerente':
        return (
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Nome do Requerente</span>
            </div>
            <p className="text-lg font-semibold text-slate-900">{data.requesterName}</p>
          </div>
        );
      
      case 'familia':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">ID da Família</span>
              </div>
              <p className="text-lg font-semibold text-slate-900">{data.familyId}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Building className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Nome da Família</span>
              </div>
              <p className="text-lg font-semibold text-slate-900">{data.familyName}</p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Layout title="Conferência das Informações">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-green-600 mb-4">
            <Check className="w-5 h-5" />
            <span className="text-sm font-medium">Informações coletadas com sucesso</span>
          </div>
          <p className="text-slate-600">
            Revise as informações abaixo antes de enviar o documento para processamento.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Localização</span>
            </div>
            <p className="text-lg font-semibold text-slate-900 capitalize">{data.location}</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Tipo de Envio</span>
            </div>
            <p className="text-lg font-semibold text-slate-900">{submissionTypeLabel}</p>
          </div>

          {renderSubmissionDetails()}

          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Tipo de Documento</span>
            </div>
            <p className="text-lg font-semibold text-slate-900">{documentTypeLabel}</p>
          </div>

          {data.file && (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Documento Enviado</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{data.file.name}</p>
                  <p className="text-sm text-slate-600">
                    {(data.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowDocument(true)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 transition-colors duration-200"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Visualizar</span>
                  </button>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Carregado
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Próximos Passos</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• O documento será processado pela equipe de tradução</li>
            <li>• Você receberá uma notificação quando estiver pronto</li>
            <li>• O prazo estimado é de 3-5 dias úteis</li>
          </ul>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-8">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-3 text-slate-600 hover:text-slate-800 disabled:opacity-50 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2 group"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                <span>Enviar Documento</span>
              </>
            )}
          </button>
        </div>
      </div>

      {showDocument && renderDocumentPreview()}
    </Layout>
  );
}