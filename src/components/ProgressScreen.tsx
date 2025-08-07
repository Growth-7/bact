import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader, AlertTriangle, FileUp, Building, Send, PartyPopper } from 'lucide-react';
import Layout from './Layout';
import axios from 'axios';

interface ProgressScreenProps {
    submissionId: string;
    onComplete: (data: { bitrixDealId?: string; fileUrls?: string[] }) => void;
}

const statusSteps = [
    { key: 'PROCESSING', text: 'Iniciando o processamento', icon: <Loader /> },
    { key: 'UPLOADING_FILES', text: 'Enviando arquivos para o Google Drive', icon: <FileUp /> },
    { key: 'CREATING_DEAL', text: 'Criando registro no CRM', icon: <Building /> },
    { key: 'COMPLETED', text: 'Processo concluído com sucesso!', icon: <PartyPopper /> }
];

type Status = 'PENDING' | 'PROCESSING' | 'UPLOADING_FILES' | 'CREATING_DEAL' | 'COMPLETED' | 'FAILED';

interface SubmissionStatus {
    id: string;
    status: Status;
    statusDetails?: string;
    bitrixDealId?: string;
    fileUrls?: string[];
}

export default function ProgressScreen({ submissionId, onComplete }: ProgressScreenProps) {
    const [currentStatus, setCurrentStatus] = useState<Status>('PENDING');
    const [statusDetails, setStatusDetails] = useState('Aguardando para iniciar...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!submissionId) return;

        const fetchStatus = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || '';
                const response = await axios.get(`${apiUrl}/api/submissions/${submissionId}/status`);

                if (response.data.success) {
                    const { status: newStatus, statusDetails: newDetails, bitrixDealId, fileUrls } = response.data.data as SubmissionStatus;
                    
                    setCurrentStatus(newStatus);
                    if(newDetails) setStatusDetails(newDetails);

                    if (newStatus === 'COMPLETED') {
                        setTimeout(() => onComplete({ bitrixDealId, fileUrls }), 2000); // Aguarda 2s antes de ir para a tela de sucesso
                        return; // Para o polling
                    }
                    if (newStatus === 'FAILED') {
                        setError(newDetails || 'Ocorreu uma falha desconhecida.');
                        return; // Para o polling
                    }
                } else {
                    throw new Error(response.data.message || 'Não foi possível obter o status.');
                }
            } catch (err: any) {
                setError(err.message || 'Erro de conexão ao buscar status.');
            }
        };

        const intervalId = setInterval(fetchStatus, 3000);

        return () => clearInterval(intervalId);

    }, [submissionId, onComplete]);

    const getStepStatus = (stepKey: string) => {
        const currentIndex = statusSteps.findIndex(s => s.key === currentStatus);
        const stepIndex = statusSteps.findIndex(s => s.key === stepKey);

        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'in_progress';
        return 'pending';
    };

    return (
        <Layout title="Progresso do Envio">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-center mb-8">Acompanhe o seu Envio</h2>
                <div className="space-y-8">
                    {statusSteps.map((step, index) => {
                        const status = getStepStatus(step.key);
                        return (
                            <div key={index} className="flex items-center">
                                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-6 ${
                                    status === 'completed' ? 'bg-green-500 text-white' : 
                                    status === 'in_progress' ? 'bg-blue-500 text-white animate-pulse' : 
                                    'bg-gray-200 text-gray-500'
                                }`}>
                                    {status === 'completed' ? <CheckCircle size={24} /> : React.cloneElement(step.icon, { size: 24 })}
                                </div>
                                <div className="text-lg font-medium text-gray-800">{step.text}</div>
                            </div>
                        );
                    })}
                </div>
                
                <div className="mt-8 pt-6 border-t text-center">
                    {currentStatus === 'FAILED' ? (
                        <div className="bg-red-100 text-red-700 p-4 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="mr-3" />
                            <div>
                                <h3 className="font-bold">Falha no Envio</h3>
                                <p>{error}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-600">{statusDetails}</p>
                    )}
                </div>
            </div>
        </Layout>
    );
}

