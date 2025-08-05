import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import LocationSelectionScreen from './components/LocationSelectionScreen';
import DocumentUploadScreen from './components/DocumentUploadScreen';
import ReviewScreen from './components/ReviewScreen';
import SuccessScreen from './components/SuccessScreen';
import { DocumentSubmission, User } from './types';

type Screen = 'login' | 'register' | 'location' | 'upload' | 'review' | 'success';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<'carrao' | 'alphaville' | null>(null);
  const [documentData, setDocumentData] = useState<DocumentSubmission | null>(null);
  const [bitrixDealId, setBitrixDealId] = useState<string | null>(null);

  // ATUALIZADO: Recebe o objeto User completo
  const handleLogin = (loggedInUser: User) => {
    console.log('Usuário recebido no login:', loggedInUser); // Log para depuração
    setUser(loggedInUser);
    setCurrentScreen('location');
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
    setSelectedLocation(null);
    setBitrixDealId(null);
  };
  
  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
  };

  switch (currentScreen) {
    case 'login':
      return <LoginScreen onLogin={handleLogin} onSwitchToRegister={() => setCurrentScreen('register')} />;
    case 'register':
      return <RegisterScreen onRegisterSuccess={() => setCurrentScreen('login')} onSwitchToLogin={() => setCurrentScreen('login')} />;
    case 'location':
      return <LocationSelectionScreen onNext={(loc) => { setSelectedLocation(loc); setCurrentScreen('upload'); }} onBack={handleLogout} />;
    case 'upload':
      if (selectedLocation) {
        return <DocumentUploadScreen location={selectedLocation} onNext={handleDocumentSubmit} onBack={() => setCurrentScreen('location')} />;
      }
      break;
    case 'review':
      // Garante que o usuário existe antes de renderizar
      if (documentData && user) {
        return <ReviewScreen data={documentData} user={user} onBack={() => setCurrentScreen('upload')} onSubmit={handleFinalSubmit} />;
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
