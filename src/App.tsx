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
    const persistedFamilyRaw = localStorage.getItem('selectedFamily');
    if (storedToken) {
      handleLogin(storedToken);
      if (persistedFamilyRaw) {
        try {
          const fam = JSON.parse(persistedFamilyRaw);
          if (fam && fam.id) {
            setSelectedFamily({ id: fam.id, name: fam.name || 'Família', members: fam.members || [], documentsCount: fam.documentsCount || 0 });
            // Buscar membros e documentos atualizados e ir direto para a lista da família
            (async () => {
              try {
                const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
                const [membersRes, docsRes] = await Promise.all([
                  fetch(`${apiUrl}/api/auth/family-members/${fam.id}`),
                  fetch(`${apiUrl}/api/submissions/family/${fam.id}`),
                ]);
                const [membersData, docsData] = await Promise.all([membersRes.json(), docsRes.json()]);
                if (membersRes.ok && membersData.success) {
                  const membersDetailed = (membersData.members || []).map((m: any) => ({ id: m.id, name: m.name, customer_type: m.customer_type }));
                  const memberNames: string[] = membersDetailed.map((m: any) => m.name).filter(Boolean);
                  setFamilyMembers(membersDetailed);
                  setSelectedFamily(prev => prev ? { ...prev, name: membersData.familyName || prev.name, members: memberNames } : prev);
                }
                setFamilyDocuments(docsRes.ok && docsData.success ? (docsData.data || []) : []);
              } catch {}
              setCurrentScreen('documentsList');
            })();
          }
        } catch {}
      }
    }
  }, []);

  // Persistir contexto da família para sobreviver ao F5
  useEffect(() => {
    if (selectedFamily && selectedFamily.id) {
      const { id, name, members = [], documentsCount = 0 } = selectedFamily;
      localStorage.setItem('selectedFamily', JSON.stringify({ id, name, members, documentsCount }));
    } else {
      localStorage.removeItem('selectedFamily');
    }
  }, [selectedFamily]);

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
    // Após concluir um envio, permanece no contexto da família: mostrar success e permitir voltar para a lista
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
    // Após um envio, voltar para a lista da família atual, mantendo o contexto
    setCurrentScreen(selectedFamily ? 'documentsList' : 'familySearch');
    setDocumentData(null);
    setSelectedLocation(null);
    setSubmissionId(null);
    setFinalSubmissionData(null);
  };

  const handleCompleteFamily = () => {
    // Ao concluir família, limpar contexto e voltar para a busca
    setSelectedFamily(null);
    setFamilyDocuments([]);
    setFamilyMembers([]);
    setDocumentData(null);
    setSelectedLocation(null);
    setSubmissionId(null);
    setFinalSubmissionData(null);
    setCurrentScreen('familySearch');
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
            onCompleteFamily={handleCompleteFamily}
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
