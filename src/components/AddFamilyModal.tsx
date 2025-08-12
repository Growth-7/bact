import React, { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';

interface AddFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFamilyAdd: (familyId: string, familyName: string) => void;
  supabaseUrl: string;
  supabaseKey: string;
  userId: string | null;
}

export default function AddFamilyModal({ isOpen, onClose, onFamilyAdd, supabaseUrl, supabaseKey, userId }: AddFamilyModalProps) {
  const [formData, setFormData] = useState({
    nome_familia: '',
    observacao: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome_familia.trim()) {
      setError('O nome da família é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = { ...formData };
      if (!payload.observacao) delete payload.observacao;

      /*
      if (userId) {
        payload.italiano = userId;
        payload.administrador = userId;
      }
      */

      const response = await fetch(`${supabaseUrl}/functions/v1/addFamilia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ data: [payload] }) 
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao adicionar família.');
      }
      
      const newFamily = result?.data?.[0];
      if (!newFamily?.id || !newFamily?.nome_familia) {
        throw new Error('A API não retornou os dados da nova família.');
      }

      onFamilyAdd(newFamily.id, newFamily.nome_familia);
      setFormData({ nome_familia: '', observacao: '' });
      onClose();

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg m-4 transform transition-all duration-300 scale-95 opacity-0 animate-scaleIn">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Adicionar Nova Família</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nome_familia" className="block text-slate-700 font-semibold mb-2">
              Nome da Família <span className="text-red-500">*</span>
            </label>
            <input
              id="nome_familia"
              name="nome_familia"
              type="text"
              value={formData.nome_familia}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Digite o nome completo da família"
              required
            />
          </div>
          
          <div>
            <label htmlFor="observacao" className="block text-slate-700 font-semibold mb-2">
              Observação
            </label>
            <textarea
              id="observacao"
              name="observacao"
              value={formData.observacao}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Alguma observação importante sobre esta família?"
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
              <p>{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center space-x-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Família'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
