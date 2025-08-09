import React, { useEffect, useState } from 'react';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import LocationSelectionScreen from './components/LocationSelectionScreen';
import DocumentUploadScreen from './components/DocumentUploadScreen';
import ReviewScreen from './components/ReviewScreen';
import SuccessScreen from './components/SuccessScreen';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import PasswordResetSuccessScreen from './components/PasswordResetSuccessScreen';
import ProgressScreen from './components/ProgressScreen'; // Importar
import FamilySearchScreen from './components/FamilySearchScreen';
import DocumentsListScreen from './components/DocumentsListScreen';
import { DocumentSubmission, User } from './types';
import { jwtDecode } from 'jwt-decode';

type Screen = 'login' | 'register' | 'forgotPassword' | 'resetPassword' | 'passwordResetSuccess' | 'familySearch' | 'documentsList' | 'location' | 'upload' | 'review' | 'progress' | 'success';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<'carrao' | 'alphaville' | null>(null);
  const [documentData, setDocumentData] = useState<DocumentSubmission | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null); // Novo estado
  const [finalSubmissionData, setFinalSubmissionData] = useState<{ bitrixDealId?: string; fileUrls?: string[] } | null>(null);
  const [pendingResetData, setPendingResetData] = useState<{ username: string; birthDate: string } | null>(null);

  useEffect(() => {
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
      setCurrentScreen('familySearch');
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
    if (selectedFamily) {
      const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
      fetch(`${apiUrl}/api/submissions/family/${selectedFamily.id}`)
        .then(r => r.json())
        .then(d => setFamilyDocuments(d.success ? d.data : []))
        .catch(() => {});
    }
  };

  const handleReset = () => {
    setCurrentScreen('familySearch');
    setDocumentData(null);
    setSelectedLocation(null);
    setSubmissionId(null);
    setFinalSubmissionData(null);
  };

  // Fluxo de documentos por família
  const [selectedFamily, setSelectedFamily] = useState<{ id: string; name: string; members: string[]; documentsCount: number } | null>(null);
  const [familyDocuments, setFamilyDocuments] = useState<DocumentSubmission[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Array<{ id: string; name: string; customer_type: string }>>([]);

  const handleFamilySelect = async (family: { id: string; name: string; members: string[]; documentsCount: number }) => {
    setSelectedFamily({ ...family, members: family.members || [] });
    try {
      const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/auth/family-members/${family.id}`);
      const data = await response.json();
      if (response.ok && data.success) {
        const membersDetailed = (data.members || []).map((m: any) => ({ id: m.id, name: m.name, customer_type: m.customer_type }));
        const memberNames: string[] = membersDetailed.map((m: any) => m.name).filter(Boolean);
        setFamilyMembers(membersDetailed);
        setSelectedFamily(prev => prev ? { ...prev, name: data.familyName || prev.name, members: memberNames } : prev);
      }
      const docsRes = await fetch(`${apiUrl}/api/submissions/family/${family.id}`);
      const docsData = await docsRes.json();
      setFamilyDocuments(docsRes.ok && docsData.success ? (docsData.data || []) : []);
    } catch (_) {
      // silencioso
    }
    setCurrentScreen('documentsList');
  };

  const handleAddFamilyDocument = () => {
    if (!selectedFamily) return;
    const initial: DocumentSubmission = {
      location: 'alphaville',
      submissionType: 'familia',
      nomeFamilia: selectedFamily.name,
      idFamilia: selectedFamily.id,
      files: [],
    };
    setDocumentData(initial);
    setCurrentScreen('upload');
  };

  const handleAddRequesterDocument = () => {
    if (!selectedFamily) return;
    const initial: DocumentSubmission = {
      location: 'alphaville',
      submissionType: 'requerente',
      nomeFamilia: selectedFamily.name,
      idFamilia: selectedFamily.id,
      files: [],
    };
    setDocumentData(initial);
    setCurrentScreen('upload');
  };

  const handleAddRequesterDocumentFor = (member: { id: string; name: string }) => {
    if (!selectedFamily) return;
    const initial: DocumentSubmission = {
      location: 'alphaville',
      submissionType: 'requerente',
      nomeFamilia: selectedFamily.name,
      idFamilia: selectedFamily.id,
      idRequerente: member.id,
      nomeRequerente: member.name,
      files: [],
    };
    setDocumentData(initial);
    setCurrentScreen('upload');
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
      return (
        <ForgotPasswordScreen
          onSwitchToLogin={() => setCurrentScreen('login')}
          onValidated={({ username, birthDate }) => {
            setPendingResetData({ username, birthDate });
            setCurrentScreen('resetPassword');
          }}
        />
      );
    case 'resetPassword':
      if (pendingResetData) {
        return (
          <ResetPasswordScreen
            username={pendingResetData.username}
            birthDate={pendingResetData.birthDate}
            onSuccess={() => setCurrentScreen('passwordResetSuccess')}
            onBack={() => setCurrentScreen('forgotPassword')}
          />
        );
      }
      break;
    case 'passwordResetSuccess':
      return <PasswordResetSuccessScreen onGoToLogin={() => setCurrentScreen('login')} />;
    case 'familySearch':
      return (
        <FamilySearchScreen
          onFamilySelect={handleFamilySelect}
          onBack={() => setCurrentScreen('login')}
        />
      );
    case 'documentsList':
      if (selectedFamily) {
        return (
          <DocumentsListScreen
            family={selectedFamily}
            documents={familyDocuments}
            onBack={() => setCurrentScreen('familySearch')}
            onAddDocument={handleAddRequesterDocument}
            onAddFamilyDocument={handleAddFamilyDocument}
            members={familyMembers}
            onAddDocumentForRequester={handleAddRequesterDocumentFor}
          />
        );
      }
      break;
    case 'location':
      return <LocationSelectionScreen onNext={(loc) => { setSelectedLocation(loc); setCurrentScreen('upload'); }} onBack={handleLogout} />;
    case 'upload':
      return (
        <DocumentUploadScreen
          location={selectedLocation || 'alphaville'}
          onNext={handleDocumentSubmit}
          onBack={() => setCurrentScreen(selectedFamily ? 'documentsList' : 'location')}
          initialData={documentData}
          existingDocuments={familyDocuments}
        />
      );
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
