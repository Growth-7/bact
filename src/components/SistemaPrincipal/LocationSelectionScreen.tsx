import { useState } from 'react';
import { MapPin, Building2, ArrowRight } from 'lucide-react';
import Layout from '../Layout';

interface LocationSelectionScreenProps {
  onNext: (location: 'carrao' | 'alphaville') => void;
  onBack: () => void;
  onNavigateToAdmin?: () => void;
}

export default function LocationSelectionScreen({ onNext, onBack }: LocationSelectionScreenProps) {
  const [selectedLocation, setSelectedLocation] = useState<'carrao' | 'alphaville' | null>(null);

  const handleSubmit = () => {
    if (selectedLocation) {
      onNext(selectedLocation);
    }
  };

  return (
    <Layout title="Selecione a Localização">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="mb-8">
          <p className="text-slate-600">
            Escolha a localização para prosseguir com o envio dos documentos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div
            onClick={() => setSelectedLocation('carrao')}
            className={`cursor-pointer border-2 rounded-xl p-6 transition-all duration-200 ${
              selectedLocation === 'carrao'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-center">
              <MapPin className={`w-12 h-12 mx-auto mb-4 ${
                selectedLocation === 'carrao' ? 'text-blue-600' : 'text-slate-400'
              }`} />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Carrão</h3>
              <p className="text-sm text-slate-600">
                Processo simplificado sem validação de ID
              </p>
            </div>
          </div>

          <div
            onClick={() => setSelectedLocation('alphaville')}
            className={`cursor-pointer border-2 rounded-xl p-6 transition-all duration-200 ${
              selectedLocation === 'alphaville'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-center">
              <Building2 className={`w-12 h-12 mx-auto mb-4 ${
                selectedLocation === 'alphaville' ? 'text-blue-600' : 'text-slate-400'
              }`} />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Alphaville</h3>
              <p className="text-sm text-slate-600">
                Processo completo com validação de ID
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center space-x-2 px-6 py-3 text-slate-600 hover:text-slate-800 transition-colors duration-200"
          >
            <span>Voltar</span>
          </button>

          <button
            onClick={handleSubmit}
            disabled={!selectedLocation}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2 group"
          >
            <span>Continuar</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </Layout>
  );
}