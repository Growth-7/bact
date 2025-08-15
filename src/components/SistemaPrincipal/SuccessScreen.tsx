import React from 'react';
import { CheckCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import Layout from '../Layout';

interface SuccessScreenProps {
  onReset: () => void;
  bitrixDealId: string | null;
  statusDetails: string | null;
}

export default function SuccessScreen({ onReset, bitrixDealId, statusDetails }: SuccessScreenProps) {
  const bitrixCardUrl = bitrixDealId
    ? `https://eunaeuropacidadania.bitrix24.com.br/crm/type/1132/details/${bitrixDealId}/`
    : '#';

  const wasUpdated = statusDetails?.includes('atualizado');
  const message = wasUpdated
    ? 'Seu documento foi recebido e o card existente no Bitrix24 foi atualizado.'
    : 'Seu documento foi recebido e um novo card foi criado no Bitrix24.';
  const buttonText = wasUpdated ? 'Ver Card Atualizado no Bitrix24' : 'Ver Card Criado no Bitrix24';

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md text-center fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-light text-slate-900 mb-2">Envio Concluído!</h3>
              <p className="text-slate-600">
                {message}
              </p>
            </div>

            {bitrixDealId && (
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <a
                  href={bitrixCardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium group"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <ExternalLink className="w-5 h-5" />
                    <span>{buttonText}</span>
                  </div>
                </a>
              </div>
            )}

            <button
              onClick={onReset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
              <span>Enviar Novo Documento</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
