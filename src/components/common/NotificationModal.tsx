import React from 'react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Aviso Importante</h2>
        <p>Os envios de dados de 'Ranking ou Parecer' realizados ontem infelizmente foram perdidos. Nenhum documento foi afetado. Nossa equipe técnica já está trabalhando para restaurar os dados. Agradecemos a compreensão.</p>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
