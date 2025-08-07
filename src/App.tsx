import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import LocationSelectionScreen from './components/LocationSelectionScreen';
import DocumentUploadScreen from './components/DocumentUploadScreen';
import ReviewScreen from './components/ReviewScreen';
import SuccessScreen from './components/SuccessScreen';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import ProgressScreen from './components/ProgressScreen'; // Importar
import { DocumentSubmission, User } from './types';
import { jwtDecode } from 'jwt-decode';

type Screen = 'login' | 'register' | 'forgotPassword' | 'location' | 'upload' | 'review' | 'progress' | 'success'; // Adicionar 'progress'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<'carrao' | 'alphaville' | null>(null);
  const [documentData, setDocumentData] = useState<DocumentSubmission | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null); // Novo estado
  const [finalSubmissionData, setFinalSubmissionData] = useState<{ bitrixDealId?: string; fileUrls?: string[] } | null>(null);

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
      localStorage.setItem('authToken', tkn);
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

  const handleFinalSubmit = (result: { submissionId: string }) => {
    setSubmissionId(result.submissionId);
    setCurrentScreen('progress');
  };

  const handleCompletion = (data: { bitrixDealId?: string; fileUrls?: string[] }) => {
    setFinalSubmissionData(data);
    setCurrentScreen('success');
  };

  const handleReset = () => {
    setCurrentScreen('location');
    setDocumentData(null);
    setSelectedLocation(null);
    setSubmissionId(null);
    setFinalSubmissionData(null);
  };
  
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    setCurrentScreen('login');
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
        return <DocumentUploadScreen location={selectedLocation} onNext={handleDocumentSubmit} onBack={() => setCurrentScreen('location')} initialData={documentData} />;
      }
      break;
    case 'review':
      if (documentData && user) {
        return <ReviewScreen data={documentData} user={user} onBack={() => setCurrentScreen('upload')} onSubmit={handleFinalSubmit} />;
      }
      break;
    case 'progress':
      if (submissionId) {
        return <ProgressScreen submissionId={submissionId} onComplete={handleCompletion} />;
      }
      break;
    case 'success':
      return <SuccessScreen onReset={handleReset} bitrixDealId={finalSubmissionData?.bitrixDealId || null} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p>Carregando...</p>
    </div>
  );
}

export default App;
