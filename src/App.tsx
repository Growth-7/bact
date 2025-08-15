import { useEffect, useRef, useState } from 'react';
import WelcomeScreen from './components/SistemaPrincipal/WelcomeScreen'; // Importar WelcomeScreen
import LoginScreen from './components/SistemaPrincipal/LoginScreen';
import RegisterScreen from './components/SistemaPrincipal/RegisterScreen';
import LocationSelectionScreen from './components/SistemaPrincipal/LocationSelectionScreen';
import DocumentUploadScreen from './components/SistemaPrincipal/DocumentUploadScreen';
import ReviewScreen from './components/SistemaPrincipal/ReviewScreen';
import SuccessScreen from './components/SistemaPrincipal/SuccessScreen';
import ForgotPasswordScreen from './components/SistemaPrincipal/ForgotPasswordScreen';
import ResetPasswordScreen from './components/SistemaPrincipal/ResetPasswordScreen';
import PasswordResetSuccessScreen from './components/SistemaPrincipal/PasswordResetSuccessScreen';
import ProgressScreen from './components/SistemaPrincipal/ProgressScreen'; // Importar
import FamilySearchScreen from './components/SistemaPrincipal/FamilySearchScreen';
import DocumentsListScreen from './components/SistemaPrincipal/DocumentsListScreen';
import ConsultationLoginScreen from './components/Visualizador/ConsultaLoginScreen'; // Importar
import ConsultaDashboard from './components/Visualizador/ConsultaDashboard'; // Importar
import AdminDashboard from './components/SistemaPrincipal/AdminDashboard'; // Importar AdminDashboard
import { DocumentSubmission, User } from './types';
import { jwtDecode } from 'jwt-decode';
import IPBlockedScreen from './components/blockIp/IPblocked'; // Importar a nova tela

type Screen = 'welcome' | 'login' | 'register' | 'forgotPassword' | 'resetPassword' | 'passwordResetSuccess' | 'familySearch' | 'documentsList' | 'location' | 'upload' | 'review' | 'progress' | 'success' | 'consultaLogin' | 'consultaDashboard' | 'admin' | 'blocked';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome'); // Estado inicial
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<'carrao' | 'alphaville' | null>(null);
  const [documentData, setDocumentData] = useState<DocumentSubmission | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null); // Novo estado
  const [finalSubmissionData, setFinalSubmissionData] = useState<{ bitrixDealId?: string; fileUrls?: string[]; statusDetails?: string } | null>(null);
  const [pendingResetData, setPendingResetData] = useState<{ username: string; birthDate: string } | null>(null);

  // Fluxo de documentos por família (declarado antes dos efeitos para evitar TDZ)
  const [selectedFamily, setSelectedFamily] = useState<{ id: string; name: string; members: string[]; documentsCount: number } | null>(null);
  const [familyDocuments, setFamilyDocuments] = useState<DocumentSubmission[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Array<{ id: string; name: string; customer_type: string }>>([]);

  // Helpers de URL/Deep-link
  const pushUrl = (path: string) => {
    try { window.history.pushState({}, '', path); } catch {}
  };
  const replaceUrl = (path: string) => {
    try { window.history.replaceState({}, '', path); } catch {}
  };
  const getQueryParam = (name: string): string | null => {
    try { return new URLSearchParams(window.location.search).get(name); } catch { return null; }
  };
  const getPathname = (): string => {
    try { return window.location.pathname || '/'; } catch { return '/'; }
  };
  const fetchFamilyAndEnter = async (familyIdOrName: string) => {
    const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
    // Primeiro tenta buscar membros por ID diretamente; se falhar, faz uma busca por nome/id
    const trySetById = async (id: string) => {
      try {
        const [membersRes, docsRes] = await Promise.all([
          fetch(`${apiUrl}/api/auth/family-members/${id}`),
          fetch(`${apiUrl}/api/submissions/family/${id}`),
        ]);
        const [membersData, docsData] = await Promise.all([membersRes.json(), docsRes.json()]);
        if (membersRes.ok && membersData.success) {
          const membersDetailed = (membersData.members || []).map((m: any) => ({ id: m.id, name: m.name, customer_type: m.customer_type }));
          const memberNames: string[] = membersDetailed.map((m: any) => m.name).filter(Boolean);
          setFamilyMembers(membersDetailed);
          setSelectedFamily({ id, name: membersData.familyName || (familyIdOrName || 'Família'), members: memberNames, documentsCount: 0 });
          setFamilyDocuments(docsRes.ok && docsData.success ? (docsData.data || []) : []);
          setCurrentScreen('documentsList');
          return true;
        }
      } catch {}
      return false;
    };
    const okById = await trySetById(familyIdOrName);
    if (okById) return;
    // Busca por nome/ID flexível
    try {
      const searchRes = await fetch(`${apiUrl}/api/auth/families/search?q=${encodeURIComponent(familyIdOrName)}`);
      const searchData = await searchRes.json();
      if (searchRes.ok && searchData.success) {
        const list: Array<{ familiaId?: string; id?: string; familiaName?: string }> = searchData.families || [];
        if (list.length > 0) {
          const first = list[0];
          const fid = (first.familiaId || first.id || '').toUpperCase();
          await trySetById(fid);
        }
      }
    } catch {}
  };

  // Deep-link pós-login (caso usuário acesse link sem estar autenticado)
  const handledDeepLinkRef = useRef(false);
  useEffect(() => {
    if (!token || handledDeepLinkRef.current) return;
    const path = getPathname().toLowerCase();
    const familiaParam = getQueryParam('familia');
    const submissionParam = getQueryParam('submission');
    if (path.startsWith('/documentos') && familiaParam) {
      handledDeepLinkRef.current = true;
      fetchFamilyAndEnter(familiaParam);
    } else if (path.startsWith('/upload') && familiaParam) {
      handledDeepLinkRef.current = true;
      fetchFamilyAndEnter(familiaParam).then(() => setCurrentScreen('upload'));
    } else if (path.startsWith('/progresso') && submissionParam) {
      handledDeepLinkRef.current = true;
      setSubmissionId(submissionParam);
      setCurrentScreen('progress');
    } else if (path.startsWith('/sucesso')) {
      handledDeepLinkRef.current = true;
      setCurrentScreen('success');
    }
  }, [token]);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      handleLogin(storedToken);
    } else {
      const path = getPathname().toLowerCase();
      if (path.startsWith('/ip-bloqueado')) {
        setCurrentScreen('blocked');
      } else {
        // Se não houver token, direciona para a tela de boas-vindas
        setCurrentScreen('welcome');
      }
    }
    
    const onPop = () => {
      // Lógica para lidar com o botão voltar do navegador
      // (Pode ser ajustada conforme a necessidade)
      const path = getPathname().toLowerCase();
      if (path.startsWith('/admin')) {
        setCurrentScreen('admin');
      } else if (path.startsWith('/familias')) {
        setCurrentScreen('familySearch');
      } else if (path.startsWith('/consulta')) {
        setCurrentScreen('consultaDashboard');
      } else {
        setCurrentScreen('welcome');
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
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

      // Redirecionamento baseado no user_type
      switch (decodedUser.user_type) {
        case 'ADMIN':
          setCurrentScreen('admin');
          replaceUrl('/admin');
          break;
        case 'VIEWER':
          setCurrentScreen('consultaDashboard');
          replaceUrl('/consulta');
          break;
        case 'OPERATOR':
        default:
          setCurrentScreen('familySearch');
          replaceUrl('/familias');
          break;
      }

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
    pushUrl(`/progresso?submission=${encodeURIComponent(result.submissionId)}`);
  };

  const handleCompletion = (data: { bitrixDealId?: string; fileUrls?: string[], statusDetails?: string }) => {
    setFinalSubmissionData(data);
    // Após concluir um envio, permanece no contexto da família: mostrar success e permitir voltar para a lista
    setCurrentScreen('success');
    if (selectedFamily) {
      const deal = data?.bitrixDealId ? `&deal=${encodeURIComponent(String(data.bitrixDealId))}` : '';
      pushUrl(`/sucesso?familia=${encodeURIComponent(selectedFamily.id)}${deal}`);
    }
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
    if (selectedFamily) {
      replaceUrl(`/Documentos?familia=${encodeURIComponent(selectedFamily.id)}`);
    } else {
      replaceUrl('/familias');
    }
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
    replaceUrl('/familias');
  };

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
    pushUrl(`/Documentos?familia=${encodeURIComponent(family.id)}`);
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
    pushUrl(`/upload?familia=${encodeURIComponent(selectedFamily.id)}&tipo=familia`);
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
    pushUrl(`/upload?familia=${encodeURIComponent(selectedFamily.id)}&tipo=requerente`);
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
    pushUrl(`/upload?familia=${encodeURIComponent(selectedFamily.id)}&tipo=requerente`);
  };
  
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    setCurrentScreen('welcome'); // Redireciona para welcome ao invés de login
    replaceUrl('/');
  };

  const handleNavigateToAdmin = () => {
    setCurrentScreen('admin');
    replaceUrl('/admin');
  };

  switch (currentScreen) {
    case 'welcome':
      return <WelcomeScreen onNavigate={(screen) => setCurrentScreen(screen)} />;
    case 'login':
      return <LoginScreen 
        onLogin={handleLogin} 
        onSwitchToRegister={() => setCurrentScreen('register')} 
        onSwitchToForgotPassword={() => setCurrentScreen('forgotPassword')}
        onBack={() => setCurrentScreen('welcome')} // Adicionar esta linha
      />;
    case 'register':
      return <RegisterScreen onRegisterSuccess={() => setCurrentScreen('login')} onSwitchToLogin={() => setCurrentScreen('login')} />;
    case 'admin':
      return <AdminDashboard onNavigateToMain={handleCompleteFamily} onLogout={handleLogout} />;
    case 'consultaLogin':
      return <ConsultationLoginScreen
        onLogin={(username) => {
          // TODO: Lógica de login para consulta
          console.log('Login de consulta com:', username);
          setCurrentScreen('consultaDashboard'); // Navega para o dashboard
        }}
        onSwitchToRegister={() => setCurrentScreen('register')}
        onSwitchToForgotPassword={() => setCurrentScreen('forgotPassword')}
        onBack={() => setCurrentScreen('welcome')} // Adicionar esta linha
      />;
    case 'consultaDashboard':
      return <ConsultaDashboard />;
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
        <div className="fade-in-slow">
          <FamilySearchScreen
          onFamilySelect={handleFamilySelect}
          onBack={() => setCurrentScreen('login')}
          onNavigateToAdmin={handleNavigateToAdmin} // Adicionar aqui
          />
        </div>
      );
    case 'documentsList':
      if (selectedFamily) {
        return (
          <div className="fade-in">
            <DocumentsListScreen
            family={selectedFamily}
            documents={familyDocuments}
            onBack={() => { setCurrentScreen('familySearch'); replaceUrl('/'); }}
            onAddDocument={handleAddRequesterDocument}
            onAddFamilyDocument={handleAddFamilyDocument}
            members={familyMembers}
            onAddDocumentForRequester={handleAddRequesterDocumentFor}
            onCompleteFamily={handleCompleteFamily}
            />
          </div>
        );
      }
      break;
    case 'location':
      return <LocationSelectionScreen onNext={(loc) => { setSelectedLocation(loc); setCurrentScreen('upload'); }} onBack={handleLogout} onNavigateToAdmin={handleNavigateToAdmin} />;
    case 'upload':
      return (
        <div className="fade-up">
          <DocumentUploadScreen
          location={selectedLocation || 'alphaville'}
          onNext={handleDocumentSubmit}
          onBack={() => setCurrentScreen(selectedFamily ? 'documentsList' : 'location')}
          initialData={documentData}
          existingDocuments={familyDocuments}
          />
        </div>
      );
    case 'review':
      if (documentData && user) {
        return <div className="fade-in"><ReviewScreen data={documentData} user={user} onBack={() => setCurrentScreen('upload')} onSubmit={handleFinalSubmit} /></div>;
      }
      break;
    case 'progress':
      if (submissionId) {
        return <div className="fade-in"><ProgressScreen submissionId={submissionId} onComplete={handleCompletion} /></div>;
      }
      break;
    case 'success':
      return <div className="fade-down"><SuccessScreen onReset={handleReset} bitrixDealId={finalSubmissionData?.bitrixDealId || null} statusDetails={finalSubmissionData?.statusDetails || null} /></div>;
    case 'blocked': {
      const blockedIP = getQueryParam('ip') || undefined;
      return <IPBlockedScreen blockedIP={blockedIP} />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p>Carregando...</p>
    </div>
  );
}

export default App;
