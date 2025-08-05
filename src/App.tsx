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

  const handleLogin = (username: string) => {
    setUser({ id: Date.now().toString(), username });
    setCurrentScreen('location');
  };

  const handleSwitchToRegister = () => {
    setCurrentScreen('register');
  };

  const handleRegisterSuccess = () => {
    setCurrentScreen('login');
  };

  const handleSwitchToLogin = () => {
    setCurrentScreen('login');
  };

  const handleLocationSelect = (location: 'carrao' | 'alphaville') => {
    setSelectedLocation(location);
    setCurrentScreen('upload');
  };

  const handleDocumentSubmit = (data: DocumentSubmission) => {
    setDocumentData(data);
    setCurrentScreen('review');
  };

  const handleReviewBack = () => {
    setCurrentScreen('upload');
  };

  const handleLocationBack = () => {
    setCurrentScreen('location');
  };

  const handleFinalSubmit = () => {
    setCurrentScreen('success');
  };

  const handleReset = () => {
    setCurrentScreen('location');
    setDocumentData(null);
    setSelectedLocation(null);
  };

  const handleLogout = () => {
    setUser(null);
    setDocumentData(null);
    setSelectedLocation(null);
    setCurrentScreen('login');
  };

  if (currentScreen === 'login') {
    return <LoginScreen onLogin={handleLogin} onSwitchToRegister={handleSwitchToRegister} />;
  }

  if (currentScreen === 'register') {
    return <RegisterScreen onRegisterSuccess={handleRegisterSuccess} onSwitchToLogin={handleSwitchToLogin} />;
  }

  if (currentScreen === 'location') {
    return <LocationSelectionScreen onNext={handleLocationSelect} onBack={handleLogout} />;
  }

  if (currentScreen === 'upload' && selectedLocation) {
    return (
      <DocumentUploadScreen
        location={selectedLocation}
        onNext={handleDocumentSubmit}
        onBack={handleLocationBack}
      />
    );
  }

  if (currentScreen === 'review' && documentData) {
    return (
      <ReviewScreen
        data={documentData}
        onBack={handleReviewBack}
        onSubmit={handleFinalSubmit}
      />
    );
  }

  if (currentScreen === 'success') {
    return <SuccessScreen onReset={handleReset} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-600">Carregando...</p>
    </div>
  );
}

export default App;