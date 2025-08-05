import React, { useState } from 'react';
import { Upload, FileText, ArrowRight, ArrowLeft, User, Users, Building } from 'lucide-react';
import Layout from './Layout';
import { DocumentSubmission, DOCUMENT_TYPES, SUBMISSION_TYPES } from '../types';

interface DocumentUploadScreenProps {
  location: 'carrao' | 'alphaville';
  onNext: (data: DocumentSubmission) => void;
  onBack: () => void;
}

export default function DocumentUploadScreen({ location, onNext, onBack }: DocumentUploadScreenProps) {
  const [formData, setFormData] = useState<DocumentSubmission>({
    location,
    submissionType: 'certidao',
    familyId: '',
    applicantId: '',
    requesterName: '',
    familyName: '',
    documentType: 'birth',
    file: null
  });
  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (field: keyof DocumentSubmission, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, file }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid()) {
      onNext(formData);
    }
  };

  const isFormValid = () => {
    if (!formData.file) return false;
    
    switch (formData.submissionType) {
      case 'certidao':
        if (location === 'alphaville') {
          return formData.familyId?.trim() && formData.applicantId?.trim();
        }
        return true; // Carrão não precisa de validação
      case 'requerente':
        return formData.requesterName?.trim();
      case 'familia':
        return formData.familyId?.trim() && formData.familyName?.trim();
      default:
        return false;
    }
  };

  const renderFormFields = () => {
    switch (formData.submissionType) {
      case 'certidao':
        if (location === 'carrao') {
          return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Carrão:</strong> Processo simplificado - apenas upload do documento necessário.
              </p>
            </div>
          );
        }
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="familyId" className="block text-sm font-medium text-slate-700 mb-2">
                ID da Família *
              </label>
              <input
                id="familyId"
                type="text"
                value={formData.familyId}
                onChange={(e) => handleInputChange('familyId', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-400"
                placeholder="Digite o ID da família"
                required
              />
            </div>
            <div>
              <label htmlFor="applicantId" className="block text-sm font-medium text-slate-700 mb-2">
                ID do Requerente *
              </label>
              <input
                id="applicantId"
                type="text"
                value={formData.applicantId}
                onChange={(e) => handleInputChange('applicantId', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-400"
                placeholder="Digite o ID do requerente"
                required
              />
            </div>
          </div>
        );
      
      case 'requerente':
        return (
          <div>
            <label htmlFor="requesterName" className="block text-sm font-medium text-slate-700 mb-2">
              Nome do Requerente *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="requesterName"
                type="text"
                value={formData.requesterName}
                onChange={(e) => handleInputChange('requesterName', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-400"
                placeholder="Digite o nome completo do requerente"
                required
              />
            </div>
          </div>
        );
      
      case 'familia':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="familyId" className="block text-sm font-medium text-slate-700 mb-2">
                ID da Família *
              </label>
              <input
                id="familyId"
                type="text"
                value={formData.familyId}
                onChange={(e) => handleInputChange('familyId', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-400"
                placeholder="Digite o ID da família"
                required
              />
            </div>
            <div>
              <label htmlFor="familyName" className="block text-sm font-medium text-slate-700 mb-2">
                Nome da Família *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="familyName"
                  type="text"
                  value={formData.familyName}
                  onChange={(e) => handleInputChange('familyName', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-400"
                  placeholder="Digite o nome da família"
                  required
                />
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Layout title={`Envio de Documentos - ${location === 'carrao' ? 'Carrão' : 'Alphaville'}`}>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="submissionType" className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de Envio
            </label>
            <select
              id="submissionType"
              value={formData.submissionType}
              onChange={(e) => handleInputChange('submissionType', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 bg-white"
            >
              {SUBMISSION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {renderFormFields()}

          <div>
            <label htmlFor="documentType" className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de Documento
            </label>
            <select
              id="documentType"
              value={formData.documentType}
              onChange={(e) => handleInputChange('documentType', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 bg-white"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Upload de Documento *
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : formData.file
                  ? 'border-green-500 bg-green-50'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*,.pdf"
              />
              
              {formData.file ? (
                <div className="space-y-2">
                  <FileText className="w-12 h-12 text-green-600 mx-auto" />
                  <p className="text-green-700 font-medium">{formData.file.name}</p>
                  <p className="text-sm text-green-600">
                    {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto" />
                  <p className="text-slate-600">
                    Arraste e solte seu arquivo aqui ou <span className="text-blue-600 font-medium">clique para selecionar</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    Formatos aceitos: PDF, JPG, PNG (máx. 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center space-x-2 px-6 py-3 text-slate-600 hover:text-slate-800 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>

            <button
              type="submit"
              disabled={!isFormValid()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2 group"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}