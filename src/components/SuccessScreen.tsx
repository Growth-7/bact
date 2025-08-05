import React from 'react';
import { CheckCircle, FileText, ArrowLeft } from 'lucide-react';
import Layout from './Layout';

interface SuccessScreenProps {
  onReset: () => void;
}

export default function SuccessScreen({ onReset }: SuccessScreenProps) {
  const protocolNumber = `BACT-${Date.now().toString().slice(-6)}`;

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-light text-slate-900 mb-2">Documento Enviado!</h3>
              <p className="text-slate-600">
                Seu documento foi recebido com sucesso e está sendo processado.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Número do Protocolo</span>
              </div>
              <p className="text-xl font-bold text-slate-900 font-mono">{protocolNumber}</p>
            </div>

            <div className="text-sm text-slate-600 mb-6 space-y-2">
              <p>• Guarde este número para acompanhar o status</p>
              <p>• Prazo estimado: 3-5 dias úteis</p>
              <p>• Você será notificado quando estiver pronto</p>
            </div>

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