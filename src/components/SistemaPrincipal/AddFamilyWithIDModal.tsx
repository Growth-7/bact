import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AddFamilyWithIDModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (familyId: string) => void;
}

export default function AddFamilyWithIDModal({ isOpen, onClose, onSubmit }: AddFamilyWithIDModalProps) {
  const [familyId, setFamilyId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (familyId.trim()) {
      onSubmit(familyId.trim());
      setFamilyId('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Adicionar Família com ID</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        <div>
          <label htmlFor="familyId" className="block text-sm font-medium text-gray-700 mb-2">
            ID da Família
          </label>
          <input
            type="text"
            id="familyId"
            value={familyId}
            onChange={(e) => setFamilyId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Digite o ID da família"
          />
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
