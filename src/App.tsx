import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import LocationSelectionScreen from './components/LocationSelectionScreen';
import DocumentUploadScreen from './components/DocumentUploadScreen';
import ReviewScreen from './components/ReviewScreen';
import SuccessScreen from './components/SuccessScreen';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import { DocumentSubmission, User, LocationType, SubmissionType, REQUERENTE_DOCUMENT_TYPES } from './types';
import { jwtDecode } from 'jwt-decode';

type Screen = 'login' | 'register' | 'forgotPassword' | 'location' | 'upload' | 'review' | 'success';

// Estado inicial para os dados do formulário de upload de documentos
const initialDocumentFormData: Omit<DocumentSubmission, 'location'> = {
  submissionType: 'requerente',
  nomeRequerente: '',
  idRequerente: '',
  nomeFamilia: '',
  idFamilia: '',
  documentType: REQUERENTE_DOCUMENT_TYPES[0],
  files: [],
};


function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationType | null>(null);
  const [documentData, setDocumentData] = useState<DocumentSubmission | null>(null);
  const [documentFormData, setDocumentFormData] = useState(initialDocumentFormData);
  const [bitrixDealId, setBitrixDealId] = useState<string | null>(null);

  React.useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      handleLogin(storedToken);
    }
  }, []);

  const handleLogin = (tkn: string) => {
    try {
      const decodedUser: User = jwtDecode(tkn);
      setUser(decodedUser);
      setToken(tkn);
      setCurrentScreen('location');
    } catch (error) {
      console.error("Failed to decode token:", error);
      handleLogout();
    }
  };

  const handleDocumentSubmit = (data: DocumentSubmission) => {
    setDocumentData(data);
    setCurrentScreen('review');
  };

  const handleFinalSubmit = (submissionResult: { bitrixDealId: string }) => {
    setBitrixDealId(submissionResult.bitrixDealId);
    setCurrentScreen('success');
  };

  const handleReset = () => {
    setCurrentScreen('location');
    setDocumentData(null);
    setDocumentFormData(initialDocumentFormData); // Limpa os dados do formulário
    setSelectedLocation(null);
    setBitrixDealId(null);
  };
  
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    setCurrentScreen('login');
  };

  const handleBackToLocation = () => {
    setCurrentScreen('location');
  }

  const handleBackToUpload = () => {
    setCurrentScreen('upload');
  }

  const updateDocumentFormData = (newData: Partial<Omit<DocumentSubmission, 'location'>>) => {
    setDocumentFormData(prev => ({ ...prev, ...newData }));
  };


  switch (currentScreen) {
    case 'login':
      return <LoginScreen onLogin={handleLogin} onSwitchToRegister={() => setCurrentScreen('register')} onSwitchToForgotPassword={() => setCurrentScreen('forgotPassword')} />;
    case 'register':
      return <RegisterScreen onRegisterSuccess={() => setCurrentScreen('login')} onSwitchToLogin={() => setCurrentScreen('login')} />;
    case 'forgotPassword':
      return <ForgotPasswordScreen onSwitchToLogin={() => setCurrentScreen('login')} />;
    case 'location':
      return <LocationSelectionScreen onNext={(loc) => { setSelectedLocation(loc); setCurrentScreen('upload'); }} onBack={handleLogout} />;
    case 'upload':
      if (selectedLocation) {
        return (
          <DocumentUploadScreen 
            location={selectedLocation} 
            onNext={handleDocumentSubmit} 
            onBack={handleBackToLocation}
            initialData={documentFormData}
            onDataChange={updateDocumentFormData}
          />
        );
      }
      break;
    case 'review':
      // Garante que o usuário existe antes de renderizar
      if (documentData && user) {
        return <ReviewScreen data={documentData} user={user} onBack={handleBackToUpload} onSubmit={handleFinalSubmit} />;
      }
      break;
    case 'success':
      return <SuccessScreen onReset={handleReset} bitrixDealId={bitrixDealId} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p>Carregando...</p>
    </div>
  );
}

export default App;
